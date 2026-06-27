import type { StorageAdapter } from '@/lib/storage/types'
import { getStorage } from '@/lib/storage/engine'

type Rehydrator = (storage: StorageAdapter) => void

const rehydrators: Rehydrator[] = []
let isRehydrating = false
let hasRehydrated = false

export function registerRehydrator(fn: Rehydrator): void {
  rehydrators.push(fn)
  if (hasRehydrated) {
    try {
      fn(getStorage())
    } catch {
      // ignore errors from late rehydrators
    }
  }
}

export function rehydrateAllStores(): void {
  isRehydrating = true
  try {
    const storage = getStorage()
    for (const fn of rehydrators) {
      fn(storage)
    }
    hasRehydrated = true
  } finally {
    isRehydrating = false
  }
}

export function getIsRehydrating(): boolean {
  return isRehydrating
}
