export interface StorageProvider {
  getItem<T>(key: string): T | null
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}

export interface HighScoreEntry {
  name: string
  score: number
  date: string
}

export interface GameSaveData<T = unknown> {
  version: number
  timestamp: number
  state: T
}
