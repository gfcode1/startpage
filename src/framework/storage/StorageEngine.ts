const PREFIX = 'gf'

export type StorageChangeListener = (appId: string, key: string, value: unknown) => void
type Unsubscribe = () => void

export class StorageEngine {
  private static instance: StorageEngine
  private listeners = new Set<StorageChangeListener>()
  private namespaces = new Map<string, Set<string>>()

  static getInstance(): StorageEngine {
    if (!StorageEngine.instance) {
      StorageEngine.instance = new StorageEngine()
    }
    return StorageEngine.instance
  }

  storageKey(appId: string, key: string): string {
    return `${PREFIX}:${appId}:${key}`
  }

  get<T>(appId: string, key: string, fallback?: T): T | undefined {
    try {
      const raw = localStorage.getItem(this.storageKey(appId, key))
      if (raw === null) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  set<T>(appId: string, key: string, value: T): void {
    try {
      localStorage.setItem(this.storageKey(appId, key), JSON.stringify(value))
    } catch (e) {
      console.warn(`StorageEngine[${appId}:${key}]: set failed`, e)
      return
    }
    this.register(appId, key)
    this.notify(appId, key, value)
  }

  remove(appId: string, key: string): void {
    try {
      localStorage.removeItem(this.storageKey(appId, key))
    } catch (e) {
      console.warn(`StorageEngine[${appId}:${key}]: remove failed`, e)
    }
    this.notify(appId, key, undefined)
  }

  subscribe(listener: StorageChangeListener): Unsubscribe {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  register(appId: string, key: string): void {
    let entry = this.namespaces.get(appId)
    if (!entry) {
      entry = new Set()
      this.namespaces.set(appId, entry)
    }
    entry.add(key)
  }

  getRegisteredNamespaces(): { appId: string; keys: string[] }[] {
    const result: { appId: string; keys: string[] }[] = []
    for (const [appId, keys] of this.namespaces) {
      result.push({ appId, keys: [...keys] })
    }
    return result
  }

  getAllState(): Record<string, Record<string, unknown>> {
    const data: Record<string, Record<string, unknown>> = {}
    for (const [appId, keys] of this.namespaces) {
      const appData: Record<string, unknown> = {}
      for (const k of keys) {
        const val = this.get<unknown>(appId, k)
        if (val !== undefined) {
          appData[k] = val
        }
      }
      if (Object.keys(appData).length > 0) {
        data[appId] = appData
      }
    }
    return data
  }

  importState(data: Record<string, Record<string, unknown>>): void {
    for (const [appId, entries] of Object.entries(data)) {
      if (!entries || typeof entries !== 'object') continue
      for (const [k, value] of Object.entries(entries)) {
        this.set(appId, k, value)
      }
    }
  }

  private notify(appId: string, key: string, value: unknown): void {
    for (const listener of this.listeners) {
      try { listener(appId, key, value) } catch { /* keep going */ }
    }
  }
}

export const storageEngine = StorageEngine.getInstance()
