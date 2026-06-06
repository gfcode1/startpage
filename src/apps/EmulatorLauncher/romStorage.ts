import type { SystemId } from './constants'

const DB_NAME = 'gfcode-emulator'
const STORE_NAME = 'roms'
const DB_VERSION = 1

export interface StoredRom {
  id: string
  title: string
  system: SystemId
  fileName: string
  data: ArrayBuffer
  addedAt: number
  romSize: number
}

export interface StoredRomMeta {
  id: string
  title: string
  system: SystemId
  fileName: string
  addedAt: number
  romSize: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRom(rom: StoredRom): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(rom)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getRom(id: string): Promise<StoredRom | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => { db.close(); resolve(req.result ?? undefined) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function getAllRomMetas(): Promise<StoredRomMeta[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).openCursor()
    const results: StoredRomMeta[] = []
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        const record = cursor.value as StoredRom
        results.push({
          id: record.id,
          title: record.title,
          system: record.system,
          fileName: record.fileName,
          addedAt: record.addedAt,
          romSize: record.romSize,
        })
        cursor.continue()
      } else {
        db.close()
        resolve(results)
      }
    }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function deleteRom(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
