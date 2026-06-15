import type { StorageAdapter } from './types'
import { createLocalAdapter } from './adapters/local'

let instance: StorageAdapter | null = null
let encryptedProfileId: string | null = null

export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = createLocalAdapter()
  }
  return instance
}

export function setStorage(adapter: StorageAdapter): void {
  instance = adapter
}

export function resetStorage(): void {
  instance = null
  encryptedProfileId = null
}

export function getEncryptedProfileId(): string | null {
  return encryptedProfileId
}

export function setEncryptedProfileId(id: string | null): void {
  encryptedProfileId = id
}
