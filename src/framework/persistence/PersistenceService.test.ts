import { describe, it, expect, beforeEach } from 'vitest'
import { PersistenceService } from './PersistenceService'
import { BACKUP_VERSION } from './types'

describe('PersistenceService', () => {
  let service: PersistenceService

  beforeEach(() => {
    localStorage.clear()
    service = new PersistenceService()
  })

  it('registerNamespace adds keys', () => {
    service.registerNamespace('testapp', 'key1', 'key2')
    const namespaces = service.getRegisteredNamespaces()
    expect(namespaces).toHaveLength(1)
    expect(namespaces[0].appId).toBe('testapp')
    expect(namespaces[0].keys).toEqual(expect.arrayContaining(['key1', 'key2']))
  })

  it('registerNamespace merges keys for same app', () => {
    service.registerNamespace('testapp', 'key1')
    service.registerNamespace('testapp', 'key2')
    const namespaces = service.getRegisteredNamespaces()
    expect(namespaces).toHaveLength(1)
    expect(namespaces[0].keys).toEqual(expect.arrayContaining(['key1', 'key2']))
  })

  it('unregisterNamespace is a no-op with StorageEngine', () => {
    service.registerNamespace('testapp', 'key1')
    service.unregisterNamespace('testapp')
    // StorageEngine keeps registrations from writes; unregisterNamespace is now a no-op
    expect(service.getRegisteredNamespaces()).toHaveLength(1)
  })

  it('exportAll returns empty data for no namespaces', () => {
    const backup = service.exportAll()
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.exportedAt).toBeGreaterThan(0)
    expect(backup.data).toEqual({})
  })

  it('exportAll collects data from registered namespaces', () => {
    localStorage.setItem('gf:testapp:score', JSON.stringify(100))
    localStorage.setItem('gf:testapp:name', JSON.stringify('Alice'))
    service.registerNamespace('testapp', 'score', 'name')

    const backup = service.exportAll()
    expect(backup.data.testapp).toEqual({ score: 100, name: 'Alice' })
  })

  it('exportAll skips missing keys', () => {
    service.registerNamespace('testapp', 'exists', 'missing')
    localStorage.setItem('gf:testapp:exists', JSON.stringify('here'))

    const backup = service.exportAll()
    expect(backup.data.testapp).toEqual({ exists: 'here' })
  })

  it('exportAll collects multiple namespaces', () => {
    localStorage.setItem('gf:app1:x', JSON.stringify(1))
    localStorage.setItem('gf:app2:y', JSON.stringify(2))
    service.registerNamespace('app1', 'x')
    service.registerNamespace('app2', 'y')

    const backup = service.exportAll()
    expect(backup.data.app1).toEqual({ x: 1 })
    expect(backup.data.app2).toEqual({ y: 2 })
  })

  it('importAll writes data to localStorage', () => {
    const result = service.importAll({
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      data: {
        testapp: { greeting: 'hello', count: 42 },
      },
    })

    expect(result).toEqual({ success: true, fileSize: expect.any(Number) })
    expect(JSON.parse(localStorage.getItem('gf:testapp:greeting')!)).toBe('hello')
    expect(JSON.parse(localStorage.getItem('gf:testapp:count')!)).toBe(42)
  })

  it('importAll rejects wrong version', () => {
    const result = service.importAll({
      version: 999,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      data: {},
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('999')
  })

  it('importAll rejects null data', () => {
    const result = service.importAll(null as unknown as never)
    expect(result.success).toBe(false)
  })

  it('importAll handles empty data', () => {
    const result = service.importAll({
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      data: {},
    })

    expect(result).toEqual({ success: true, fileSize: 0 })
  })

  it('importAll overwrites existing data', () => {
    localStorage.setItem('gf:app:key', JSON.stringify('old'))
    service.importAll({
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      data: { app: { key: 'new' } },
    })
    expect(JSON.parse(localStorage.getItem('gf:app:key')!)).toBe('new')
  })

  it('export then import round-trips correctly', () => {
    localStorage.setItem('gf:roundtrip:a', JSON.stringify([1, 2, 3]))
    localStorage.setItem('gf:roundtrip:b', JSON.stringify({ deep: true }))
    service.registerNamespace('roundtrip', 'a', 'b')

    const backup = service.exportAll()
    localStorage.clear()

    const result = service.importAll(backup)
    expect(result.success).toBe(true)
    expect(JSON.parse(localStorage.getItem('gf:roundtrip:a')!)).toEqual([1, 2, 3])
    expect(JSON.parse(localStorage.getItem('gf:roundtrip:b')!)).toEqual({ deep: true })
  })
})
