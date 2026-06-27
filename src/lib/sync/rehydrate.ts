import type { StorageAdapter } from '@/lib/storage/types'
import { getStorage } from '@/lib/storage/engine'

type Rehydrator = (storage: StorageAdapter) => void

const rehydrators: Rehydrator[] = []
let isRehydrating = false

export function registerRehydrator(fn: Rehydrator): void {
  rehydrators.push(fn)
}

export function rehydrateAllStores(): void {
  isRehydrating = true
  try {
    const storage = getStorage()
    for (const fn of rehydrators) {
      fn(storage)
    }
  } finally {
    isRehydrating = false
  }
}

export function getIsRehydrating(): boolean {
  return isRehydrating
}
