import { describe, it, expect, beforeEach } from 'vitest'
import { StorageManager } from './StorageManager'

describe('StorageManager', () => {
  let storage: StorageManager

  beforeEach(() => {
    localStorage.clear()
    storage = new StorageManager('test')
  })

  it('returns fallback when key does not exist', () => {
    expect(storage.get('missing', 'default')).toBe('default')
  })

  it('stores and retrieves a value', () => {
    storage.set('key1', { foo: 'bar' })
    expect(storage.get('key1')).toEqual({ foo: 'bar' })
  })

  it('returns undefined for missing key without fallback', () => {
    expect(storage.get('nope')).toBeUndefined()
  })

  it('overwrites existing value', () => {
    storage.set('key', 'first')
    storage.set('key', 'second')
    expect(storage.get('key')).toBe('second')
  })

  it('removes a key', () => {
    storage.set('key', 'val')
    storage.remove('key')
    expect(storage.get('key')).toBeUndefined()
  })

  it('namespaces keys properly', () => {
    const a = new StorageManager('a')
    const b = new StorageManager('b')
    a.set('x', 'from-a')
    b.set('x', 'from-b')
    expect(a.get('x')).toBe('from-a')
    expect(b.get('x')).toBe('from-b')
  })

  it('getSaveData returns null when not set', () => {
    expect(storage.getSaveData('game')).toBeNull()
  })

  it('setSaveData wraps state with version and timestamp', () => {
    storage.setSaveData('game', { score: 100 })
    const data = storage.getSaveData<{ score: number }>('game')
    expect(data).not.toBeNull()
    expect(data!.version).toBe(1)
    expect(data!.timestamp).toBeGreaterThan(0)
    expect(data!.state.score).toBe(100)
  })

  it('provider interface getItem returns null for missing', () => {
    expect(storage.provider.getItem('nope')).toBeNull()
  })

  it('provider interface works end-to-end', () => {
    storage.provider.setItem('k', 'v')
    expect(storage.provider.getItem('k')).toBe('v')
    storage.provider.removeItem('k')
    expect(storage.provider.getItem('k')).toBeNull()
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('gf:test:corrupt', '{bad')
    expect(storage.get('corrupt', 'fallback')).toBe('fallback')
  })

  it('does not throw when localStorage.setItem throws', () => {
    const orig = localStorage.setItem
    localStorage.setItem = vi.fn(() => { throw new Error('error') })
    expect(() => storage.set('key', 'val')).not.toThrow()
    localStorage.setItem = orig
  })
})
