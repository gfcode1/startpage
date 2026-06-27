import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'

const QUEUE_KEY = '_sync:queue'

export interface DataChange {
  namespace: string
  entryKey: string
  value: unknown | null
  checksum: string
  timestamp: number
  deviceId: string
}

interface QueuedChange extends DataChange {
  id: string
  retries: number
  nextRetryAt: number
}

export function hashValue(value: unknown): string {
  const str = JSON.stringify(value)
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return `${str.length.toString(36)}_${Math.abs(hash).toString(36)}`
}

export class SyncQueue {
  static DEVICE_ID_KEY = '_sync:device_id'

  static getDeviceId(): string {
    const storage = getStorage()
    let id = storage.get<string>(SyncQueue.DEVICE_ID_KEY)
    if (!id) {
      id = generateId()
      storage.set(SyncQueue.DEVICE_ID_KEY, id)
    }
    return id
  }

  static enqueue(change: DataChange): void {
    const queue = SyncQueue.getAll()
    const existing = queue.findIndex(
      (q) => q.namespace === change.namespace && q.entryKey === change.entryKey,
    )
    const oldRetries = existing >= 0 ? queue[existing]!.retries : 0
    const backoff = Math.min(1000 * 2 ** oldRetries, 60000)
    const entry: QueuedChange = {
      ...change,
      id: generateId(),
      retries: oldRetries,
      nextRetryAt: Date.now() + backoff,
    }

    if (existing >= 0) {
      queue[existing] = entry
    } else {
      queue.push(entry)
    }

    getStorage().set(QUEUE_KEY, queue)
  }

  static remove(id: string): void {
    const queue = SyncQueue.getAll().filter((q) => q.id !== id)
    getStorage().set(QUEUE_KEY, queue)
  }

  static getAll(): QueuedChange[] {
    return getStorage().get<QueuedChange[]>(QUEUE_KEY) ?? []
  }

  static getDue(): QueuedChange[] {
    const now = Date.now()
    return SyncQueue.getAll().filter((q) => q.nextRetryAt <= now)
  }

  static hasPending(): boolean {
    return SyncQueue.getAll().length > 0
  }

  static incrementRetry(id: string): void {
    const queue = SyncQueue.getAll()
    const entry = queue.find((q) => q.id === id)
    if (entry) {
      entry.retries++
      entry.nextRetryAt = Date.now() + Math.min(1000 * 2 ** entry.retries, 60000)
      getStorage().set(QUEUE_KEY, queue)
    }
  }

  static clear(): void {
    getStorage().remove(QUEUE_KEY)
  }
}
