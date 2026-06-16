import type { StorageAdapter } from '../types'

const IV_LENGTH = 12
const ITERATIONS = 100_000
const KEY_LENGTH = 256
const SYSTEM_PREFIX = '_'

// ── Crypto primitives ──────────────────────────────────────────────

function toBuffer(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) as unknown as ArrayBufferView<ArrayBuffer>
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toBuffer(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

export async function encrypt(
  plaintext: unknown,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(JSON.stringify(plaintext))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBuffer(iv) },
    key,
    encoded,
  )
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`
}

export async function decrypt<T>(
  ciphertext: string,
  key: CryptoKey,
): Promise<T> {
  const colon = ciphertext.indexOf(':')
  if (colon === -1) throw new Error('Invalid ciphertext format')
  const iv = base64ToBytes(ciphertext.slice(0, colon))
  const data = base64ToBytes(ciphertext.slice(colon + 1))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBuffer(iv) },
    key,
    toBuffer(data),
  )
  return JSON.parse(new TextDecoder().decode(decrypted)) as T
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

// ── Encrypted adapter ──────────────────────────────────────────────

export interface EncryptedAdapterOptions {
  profileId: string
  key: CryptoKey
}

export function createEncryptedAdapter(
  inner: StorageAdapter,
  options: EncryptedAdapterOptions,
): StorageAdapter {
  const { profileId, key } = options
  const cache = new Map<string, unknown>()
  const pendingWrites = new Map<string, Promise<void>>()
  const listeners = new Map<string, Set<(value: unknown) => void>>()

  function notify(key: string, value: unknown) {
    listeners.get(key)?.forEach((cb) => cb(value))
  }

  function profileKey(k: string): string {
    return `${profileId}:${k}`
  }

  async function scheduleWrite(storageKey: string, value: unknown) {
    const existing = pendingWrites.get(storageKey)
    if (existing) try { await existing } catch { /* stale */ }

    const write = (async () => {
      const encrypted = await encrypt(value, key)
      inner.set(storageKey, encrypted)
    })()
    pendingWrites.set(storageKey, write)
    try {
      await write
    } finally {
      if (pendingWrites.get(storageKey) === write) {
        pendingWrites.delete(storageKey)
      }
    }
  }

  async function scheduleRemove(storageKey: string) {
    const existing = pendingWrites.get(storageKey)
    if (existing) try { await existing } catch { /* stale */ }

    const remove = (async () => {
      inner.remove(storageKey)
    })()
    pendingWrites.set(storageKey, remove)
    try {
      await remove
    } finally {
      if (pendingWrites.get(storageKey) === remove) {
        pendingWrites.delete(storageKey)
      }
    }
  }

  return {
    get<T>(k: string): T | null {
      if (k.startsWith(SYSTEM_PREFIX)) return inner.get(k)
      return (cache.get(k) as T) ?? null
    },

    set<T>(k: string, value: T): void {
      if (k.startsWith(SYSTEM_PREFIX)) {
        inner.set(k, value)
        return
      }
      cache.set(k, value)
      notify(k, value)
      scheduleWrite(profileKey(k), value)
    },

    remove(k: string): void {
      if (k.startsWith(SYSTEM_PREFIX)) {
        inner.remove(k)
        return
      }
      cache.delete(k)
      notify(k, undefined)
      scheduleRemove(profileKey(k))
    },

    subscribe(k: string, callback: (value: unknown) => void): () => void {
      if (!listeners.has(k)) listeners.set(k, new Set())
      listeners.get(k)!.add(callback)
      return () => {
        listeners.get(k)?.delete(callback)
      }
    },

    getAll(): Record<string, Record<string, unknown>> {
      const result: Record<string, Record<string, unknown>> = {}
      for (const [key, value] of cache) {
        const colon = key.indexOf(':')
        if (colon === -1) continue
        const ns = key.slice(0, colon)
        const entryKey = key.slice(colon + 1)
        if (!result[ns]) result[ns] = {}
        result[ns][entryKey] = value
      }
      return result
    },

    import(data: Record<string, Record<string, unknown>>): void {
      for (const [ns, entries] of Object.entries(data)) {
        for (const [entryKey, value] of Object.entries(entries)) {
          const fullKey = `${ns}:${entryKey}`
          if (fullKey.startsWith(SYSTEM_PREFIX)) {
            inner.set(fullKey, value)
            continue
          }
          cache.set(fullKey, value)
          notify(fullKey, value)
          scheduleWrite(profileKey(fullKey), value)
        }
      }
    },
  }
}

// ── Sync decrypt (used at unlock to populate cache) ────────────────

export async function decryptAllForProfile(
  inner: StorageAdapter,
  profileId: string,
  key: CryptoKey,
): Promise<Map<string, unknown>> {
  const cache = new Map<string, unknown>()
  const prefix = `${profileId}:`

  const raw = inner.getAll()
  for (const [ns, entries] of Object.entries(raw)) {
    if (ns === '_profiles') continue
    for (const [entryKey, value] of Object.entries(entries)) {
      const fullKey = `${ns}:${entryKey}`
      if (!fullKey.startsWith(prefix)) continue

      const appKey = fullKey.slice(prefix.length)
      if (typeof value === 'string' && value.includes(':')) {
        try {
          const decrypted = await decrypt(value, key)
          cache.set(appKey, decrypted)
        } catch {
          // skip entries that fail to decrypt
        }
      }
    }
  }
  return cache
}
