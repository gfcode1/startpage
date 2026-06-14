export interface StorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  subscribe(key: string, callback: (value: unknown) => void): () => void
  getAll(): Record<string, Record<string, unknown>>
  import(data: Record<string, Record<string, unknown>>): void
}
