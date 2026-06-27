import type { StorageAdapter } from '../types'

const PREFIX = 'sd'

function prefixed(key: string): string {
  return `${PREFIX}:${key}`
}

export function createLocalAdapter(): StorageAdapter {
  const listeners = new Map<string, Set<(value: unknown) => void>>()

  function notify(key: string, value: unknown) {
    listeners.get(key)?.forEach((cb) => cb(value))
  }

  function keyFromFull(fullKey: string): string {
    return fullKey.startsWith(`${PREFIX}:`) ? fullKey.slice(PREFIX.length + 1) : fullKey
  }

  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.key?.startsWith(`${PREFIX}:`)) return
    if (e.newValue === null) {
      notify(keyFromFull(e.key), undefined)
    } else {
      try {
        notify(keyFromFull(e.key), JSON.parse(e.newValue))
      } catch {
        // skip invalid JSON from other tabs
      }
    }
  })

  return {
    get<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(prefixed(key))
        return raw ? (JSON.parse(raw) as T) : null
      } catch {
        return null
      }
    },

    set<T>(key: string, value: T): void {
      try {
        localStorage.setItem(prefixed(key), JSON.stringify(value))
        notify(key, value)
      } catch (e) {
        console.warn(`StorageAdapter.set(${key}) failed:`, e)
      }
    },

    remove(key: string): void {
      try {
        localStorage.removeItem(prefixed(key))
        notify(key, undefined)
      } catch (e) {
        console.warn(`StorageAdapter.remove(${key}) failed:`, e)
      }
    },

    subscribe(key: string, callback: (value: unknown) => void): () => void {
      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      const cbs = listeners.get(key)
      if (cbs) cbs.add(callback)
      return () => {
        listeners.get(key)?.delete(callback)
      }
    },

    getAll(): Record<string, Record<string, unknown>> {
      const result: Record<string, Record<string, unknown>> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i)
        if (!fullKey?.startsWith(`${PREFIX}:`)) continue
        const key = fullKey.slice(PREFIX.length + 1)
        const colonIndex = key.indexOf(':')
        if (colonIndex === -1) continue
        const namespace = key.slice(0, colonIndex)
        const entryKey = key.slice(colonIndex + 1)
        if (!result[namespace]) result[namespace] = {}
        try {
          const item = localStorage.getItem(fullKey)
          if (item !== null) result[namespace][entryKey] = JSON.parse(item)
        } catch {
          // skip invalid JSON
        }
      }
      return result
    },

    import(data: Record<string, Record<string, unknown>>): void {
      for (const [namespace, entries] of Object.entries(data)) {
        for (const [key, value] of Object.entries(entries)) {
          this.set(`${namespace}:${key}`, value)
        }
      }
    },
  }
}
