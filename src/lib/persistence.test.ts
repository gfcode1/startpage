import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportBackup, importBackup, downloadBackup } from './persistence'
import { setStorage, resetStorage } from './storage/engine'
import type { StorageAdapter } from './storage/types'

const mockStorage: StorageAdapter = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  subscribe: vi.fn(() => () => {}),
  getAll: vi.fn(() => ({
    player: { volume: 0.5 },
    widget: { config: { layout: 'grid' } },
  })),
  import: vi.fn(),
}

vi.mock('@/config/app', () => ({
  APP_CONFIG: { name: 'StartDeck', version: '1.0.0', basePath: '/' },
}))

describe('exportBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStorage()
    setStorage(mockStorage)
  })

  it('exports data with metadata', () => {
    const backup = exportBackup()
    expect(backup.version).toBe('1')
    expect(backup.appVersion).toBe('1.0.0')
    expect(backup.date).toBeTruthy()
    expect(backup.data).toEqual({
      player: { volume: 0.5 },
      widget: { config: { layout: 'grid' } },
    })
  })
})

describe('importBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStorage()
    setStorage(mockStorage)
  })

  it('imports valid backup and rehydrates', () => {
    const json = JSON.stringify({
      version: '1',
      date: '2024-01-01',
      appVersion: '1.0.0',
      data: { todo: { tasks: [{ id: '1', text: 'test' }] } },
    })
    const result = importBackup(json)
    expect(result).toBe(true)
    expect(mockStorage.import).toHaveBeenCalledWith({
      todo: { tasks: [{ id: '1', text: 'test' }] },
    })
  })

  it('returns false for invalid backup', () => {
    expect(importBackup('{}')).toBe(false)
    expect(importBackup('{"version":"1"}')).toBe(false)
    expect(importBackup('not-json')).toBe(false)
  })

  it('returns false for missing data field', () => {
    expect(importBackup('{"version":"1"}')).toBe(false)
  })
})

describe('downloadBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStorage()
    setStorage(mockStorage)

    URL.createObjectURL = vi.fn(() => 'blob:url')
    URL.revokeObjectURL = vi.fn()
  })

  it('triggers a download', () => {
    const click = vi.fn()
    document.createElement = vi.fn(() => ({
      href: '',
      download: '',
      click,
    })) as unknown as typeof document.createElement

    downloadBackup()
    expect(mockStorage.getAll).toHaveBeenCalled()
  })
})
