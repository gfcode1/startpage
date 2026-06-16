import { describe, it, expect, beforeEach } from 'vitest'
import { createLocalAdapter } from './local'
import {
  deriveKey,
  generateSalt,
  encrypt,
  decrypt,
  createEncryptedAdapter,
  decryptAllForProfile,
} from './encrypted'

const TEST_PASSWORD = 'test-password-123'
const TEST_PROFILE_ID = 'profile-test-1'

async function createTestKey() {
  const salt = generateSalt()
  return deriveKey(TEST_PASSWORD, salt)
}

describe('encrypt / decrypt', () => {
  it('round-trips a simple value', async () => {
    const key = await createTestKey()
    const ciphertext = await encrypt({ hello: 'world' }, key)
    const decrypted = await decrypt<{ hello: string }>(ciphertext, key)
    expect(decrypted).toEqual({ hello: 'world' })
  })

  it('round-trips a complex nested object', async () => {
    const key = await createTestKey()
    const data = { a: [1, 2, 3], b: { nested: true }, c: null }
    const ciphertext = await encrypt(data, key)
    const decrypted = await decrypt<typeof data>(ciphertext, key)
    expect(decrypted).toEqual(data)
  })

  it('produces different ciphertext for same plaintext (random IV)', async () => {
    const key = await createTestKey()
    const ct1 = await encrypt('same', key)
    const ct2 = await encrypt('same', key)
    expect(ct1).not.toBe(ct2)
  })

  it('fails to decrypt with wrong key', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const key1 = await deriveKey('password-a', salt1)
    const key2 = await deriveKey('password-b', salt2)

    const ciphertext = await encrypt('secret', key1)
    await expect(decrypt(ciphertext, key2)).rejects.toThrow()
  })

  it('fails on malformed ciphertext', async () => {
    const key = await createTestKey()
    await expect(decrypt('invalid-ciphertext', key)).rejects.toThrow()
  })
})

describe('createEncryptedAdapter', () => {
  let inner: ReturnType<typeof createLocalAdapter>
  let adapter: ReturnType<typeof createEncryptedAdapter>
  let key: CryptoKey

  beforeEach(async () => {
    localStorage.clear()
    inner = createLocalAdapter()
    key = await createTestKey()
    adapter = createEncryptedAdapter(inner, {
      profileId: TEST_PROFILE_ID,
      key,
    })
  })

  it('set and get a value', () => {
    adapter.set('player:volume', 0.75)
    expect(adapter.get<number>('player:volume')).toBe(0.75)
  })

  it('get returns null for missing key', () => {
    expect(adapter.get('nonexistent')).toBeNull()
  })

  it('stores encrypted value in inner adapter', async () => {
    adapter.set('player:volume', 0.5)
    await new Promise((r) => setTimeout(r, 10))
    const raw = inner.get<string>(`${TEST_PROFILE_ID}:player:volume`)
    expect(raw).toBeTruthy()
    expect(raw).toContain(':')
  })

  it('can decrypt inner value back via get', () => {
    adapter.set('widget:config', { layout: 'grid' })
    expect(adapter.get<{ layout: string }>('widget:config')).toEqual({ layout: 'grid' })
  })

  it('remove a key', () => {
    adapter.set('player:volume', 1)
    adapter.remove('player:volume')
    expect(adapter.get('player:volume')).toBeNull()
  })

  it('passes system keys (underscore) through unencrypted', () => {
    adapter.set('_profiles', [{ id: '1' }])
    expect(adapter.get<unknown[]>('_profiles')).toEqual([{ id: '1' }])
    expect(inner.get<unknown[]>('_profiles')).toEqual([{ id: '1' }])
  })

  it('notifies subscribers with plaintext value on set', async () => {
    const calls: unknown[] = []
    adapter.subscribe('player:volume', (v) => calls.push(v))
    adapter.set('player:volume', 0.5)
    await new Promise((r) => setTimeout(r, 10))
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBe(0.5)
  })

  it('notifies subscribers on remove', async () => {
    adapter.set('player:volume', 0.5)
    const calls: unknown[] = []
    adapter.subscribe('player:volume', (v) => calls.push(v))
    adapter.remove('player:volume')
    await new Promise((r) => setTimeout(r, 10))
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeUndefined()
  })

  it('unsubscribe stops notifications', () => {
    const calls: unknown[] = []
    const unsub = adapter.subscribe('player:volume', (v) => calls.push(v))
    unsub()
    adapter.set('player:volume', 0.5)
    expect(calls).toHaveLength(0)
  })

  it('getAll returns all non-system cached entries', () => {
    adapter.set('player:volume', 0.5)
    adapter.set('widget:config', { layout: 'grid' })
    adapter.set('_profiles', [{ id: '1' }])

    const all = adapter.getAll()
    expect(all.player).toEqual({ volume: 0.5 })
    expect(all.widget).toEqual({ config: { layout: 'grid' } })
    expect(all._profiles).toBeUndefined()
  })

  it('import fills cache and triggers background writes', async () => {
    adapter.import({
      player: { volume: 0.8 },
      widget: { config: { layout: 'list' } },
    })
    expect(adapter.get<number>('player:volume')).toBe(0.8)
    expect(adapter.get<{ layout: string }>('widget:config')).toEqual({ layout: 'list' })
  })

  it('import notifies subscribers', async () => {
    const calls: unknown[] = []
    adapter.subscribe('player:volume', (v) => calls.push(v))
    adapter.import({ player: { volume: 0.9 } })
    await new Promise((r) => setTimeout(r, 10))
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBe(0.9)
  })
})

describe('decryptAllForProfile', () => {
  it('populates cache from existing encrypted entries', async () => {
    const inner = createLocalAdapter()
    const key = await createTestKey()

    const profileId = 'profile-2'
    const adapter = createEncryptedAdapter(inner, { profileId, key })
    adapter.set('player:volume', 0.3)
    adapter.set('widget:config', { layout: 'grid' })
    await new Promise((r) => setTimeout(r, 10))

    const cache = await decryptAllForProfile(inner, profileId, key)
    expect(cache.get('player:volume')).toBe(0.3)
    expect(cache.get('widget:config')).toEqual({ layout: 'grid' })
  })

  it('skips _profiles namespace', async () => {
    const inner = createLocalAdapter()
    const key = await createTestKey()

    inner.set('_profiles', [{ id: '1' }])

    const cache = await decryptAllForProfile(inner, 'any-profile', key)
    for (const k of cache.keys()) {
      expect(k.startsWith('_profiles')).toBe(false)
    }
  })

  it('skips entries that fail to decrypt', async () => {
    const inner = createLocalAdapter()
    const key = await createTestKey()

    inner.set('profile-3:player:volume', 'invalid:encrypted:data')

    const cache = await decryptAllForProfile(inner, 'profile-3', key)
    expect(cache.get('player:volume')).toBeUndefined()
  })
})
