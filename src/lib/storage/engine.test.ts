import { describe, it, expect, beforeEach } from 'vitest'
import { getStorage, setStorage, resetStorage } from './engine'
import type { StorageAdapter } from './types'

describe('StorageEngine', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStorage()
  })

  it('returns a singleton', () => {
    const a = getStorage()
    const b = getStorage()
    expect(a).toBe(b)
  })

  it('set and get a value', () => {
    const storage = getStorage()
    storage.set('foo', { a: 1 })
    expect(storage.get<{ a: number }>('foo')).toEqual({ a: 1 })
  })

  it('returns null for missing key', () => {
    const storage = getStorage()
    expect(storage.get('nonexistent')).toBeNull()
  })

  it('removes a value', () => {
    const storage = getStorage()
    storage.set('bar', 42)
    storage.remove('bar')
    expect(storage.get('bar')).toBeNull()
  })

  it('subscribe and notify on set', () => {
    const storage = getStorage()
    const values: unknown[] = []
    const unsub = storage.subscribe('watch', (v) => values.push(v))
    storage.set('watch', 'hello')
    storage.set('watch', 'world')
    expect(values).toEqual(['hello', 'world'])
    unsub()
    storage.set('watch', 'after')
    expect(values).toEqual(['hello', 'world'])
  })

  it('getAll returns all namespaced data', () => {
    const storage = getStorage()
    storage.set('a:x', 1)
    storage.set('a:y', 2)
    storage.set('b:z', 3)
    const all = storage.getAll()
    expect(all).toEqual({
      a: { x: 1, y: 2 },
      b: { z: 3 },
    })
  })

  it('import restores data', () => {
    const storage = getStorage()
    storage.import({
      todo: { tasks: [{ id: '1', text: 'test' }] },
    })
    expect(storage.get('todo:tasks')).toEqual([{ id: '1', text: 'test' }])
  })

  it('setStorage replaces the adapter', () => {
    const mock: StorageAdapter = {
      get: <T>() => 'mock' as unknown as T,
      set: () => {},
      remove: () => {},
      subscribe: () => () => {},
      getAll: () => ({}),
      import: () => {},
    }
    setStorage(mock)
    expect(getStorage().get('anything')).toBe('mock')
    resetStorage()
  })
})
