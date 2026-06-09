import type { StorageProvider, GameSaveData } from './types'
import { storageEngine } from './StorageEngine'

export class StorageManager {
  constructor(private namespace: string) {}

  get<T>(key: string, fallback?: T): T | undefined {
    return storageEngine.get<T>(this.namespace, key, fallback)
  }

  set<T>(key: string, value: T): void {
    storageEngine.set(this.namespace, key, value)
  }

  remove(key: string): void {
    storageEngine.remove(this.namespace, key)
  }

  getSaveData<T>(key: string): GameSaveData<T> | null {
    return this.get<GameSaveData<T>>(key) ?? null
  }

  setSaveData<T>(key: string, state: T): void {
    this.set<GameSaveData<T>>(key, {
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
