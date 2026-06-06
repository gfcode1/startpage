import type { StorageProvider, GameSaveData } from './types'

const PREFIX = 'gf'

export class StorageManager {
  constructor(private namespace: string) {}

  private key(k: string): string {
    return `${PREFIX}:${this.namespace}:${k}`
  }

  get<T>(key: string, fallback?: T): T | undefined {
    try {
      const raw = localStorage.getItem(this.key(key))
      if (raw === null) return fallback
      return JSON.parse(raw) as T
    } catch (e) {
      console.warn(`StorageManager[${this.namespace}]: get failed for "${key}"`, e)
      return fallback
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`StorageManager[${this.namespace}]: set failed for "${key}"`, e)
      return false
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.key(key))
    } catch (e) {
      console.warn(`StorageManager[${this.namespace}]: remove failed for "${key}"`, e)
    }
  }

  getSaveData<T>(key: string): GameSaveData<T> | null {
    return this.get<GameSaveData<T>>(key) ?? null
  }

  setSaveData<T>(key: string, state: T): boolean {
    return this.set<GameSaveData<T>>(key, {
      version: 1,
      timestamp: Date.now(),
      state,
    })
  }

  get provider(): StorageProvider {
    return {
      getItem: <T>(key: string) => this.get<T>(key) ?? null,
      setItem: (key, value) => { this.set(key, value) },
      removeItem: (key) => { this.remove(key) },
    }
  }
}
