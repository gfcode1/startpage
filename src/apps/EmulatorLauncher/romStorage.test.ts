import { describe, it, expect, beforeAll } from 'vitest'
import { saveRom, getRom, getAllRomMetas, deleteRom } from './romStorage'
import type { StoredRom } from './romStorage'

// jsdom does not support IndexedDB; skip all tests in this suite.
const hasIndexedDB = typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function'

function createMockRom(overrides?: Partial<StoredRom>): StoredRom {
  return {
    id: 'test:nes:mario.nes',
    title: 'Mario',
    system: 'nes',
    fileName: 'mario.nes',
    data: new ArrayBuffer(8),
    addedAt: Date.now(),
    romSize: 8,
    ...overrides,
  }
}

describe.runIf(hasIndexedDB)('romStorage', () => {
  beforeAll(async () => {
    const dbs = await indexedDB.databases()
    for (const db of dbs) {
      if (db.name === 'gfcode-emulator') {
        indexedDB.deleteDatabase(db.name)
      }
    }
  })

  describe('saveRom', () => {
    it('saves a rom and retrieves it via getRom', async () => {
      const rom = createMockRom()
      await saveRom(rom)
      const result = await getRom(rom.id)
      expect(result).toBeDefined()
      expect(result!.id).toBe(rom.id)
      expect(result!.title).toBe('Mario')
      expect(result!.system).toBe('nes')
    })

    it('overwrites an existing rom with same id', async () => {
      await saveRom(createMockRom({ title: 'Original' }))
      await saveRom(createMockRom({ title: 'Updated' }))
      const result = await getRom('test:nes:mario.nes')
      expect(result!.title).toBe('Updated')
    })
  })

  describe('getRom', () => {
    it('returns undefined for non-existent rom', async () => {
      const result = await getRom('nonexistent')
      expect(result).toBeUndefined()
    })

    it('returns full StoredRom with data', async () => {
      const rom = createMockRom({ data: new ArrayBuffer(16) })
      await saveRom(rom)
      const result = await getRom(rom.id)
      expect(result!.data.byteLength).toBe(16)
    })
  })

  describe('getAllRomMetas', () => {
    it('returns empty array when no roms saved', async () => {
      const metas = await getAllRomMetas()
      expect(metas).toEqual([])
    })

    it('returns metadata for all saved roms', async () => {
      await saveRom(createMockRom({ id: 'rom1', title: 'Game 1' }))
      await saveRom(createMockRom({ id: 'rom2', title: 'Game 2' }))
      const metas = await getAllRomMetas()
      expect(metas).toHaveLength(2)
      expect(metas.find(m => m.id === 'rom1')!.title).toBe('Game 1')
      expect(metas.find(m => m.id === 'rom2')!.title).toBe('Game 2')
    })

    it('does not include data in metadata', async () => {
      await saveRom(createMockRom())
      const metas = await getAllRomMetas()
      expect(metas[0]).not.toHaveProperty('data')
    })
  })

  describe('deleteRom', () => {
    it('deletes a rom by id', async () => {
      await saveRom(createMockRom())
      await deleteRom('test:nes:mario.nes')
      const result = await getRom('test:nes:mario.nes')
      expect(result).toBeUndefined()
    })

    it('does not throw when deleting non-existent rom', async () => {
      await expect(deleteRom('nonexistent')).resolves.toBeUndefined()
    })
  })
})
