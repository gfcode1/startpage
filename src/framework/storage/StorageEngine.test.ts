import { describe, it, expect, beforeEach } from 'vitest'
import { StorageEngine } from './StorageEngine'

describe('StorageEngine', () => {
  let engine: StorageEngine

  beforeEach(() => {
    localStorage.clear()
    engine = new StorageEngine()
  })

  it('returns fallback when key does not exist', () => {
    expect(engine.get('app', 'missing', 'default')).toBe('default')
  })

  it('stores and retrieves a value', () => {
    engine.set('app', 'key', { foo: 'bar' })
    expect(engine.get('app', 'key')).toEqual({ foo: 'bar' })
  })

  it('returns undefined for missing key without fallback', () => {
    expect(engine.get('app', 'nope')).toBeUndefined()
  })

  it('overwrites existing value', () => {
    engine.set('app', 'key', 'first')
    engine.set('app', 'key', 'second')
    expect(engine.get('app', 'key')).toBe('second')
  })

  it('removes a key', () => {
    engine.set('app', 'key', 'val')
    engine.remove('app', 'key')
    expect(engine.get('app', 'key')).toBeUndefined()
  })

  it('namespaces keys properly', () => {
    engine.set('a', 'x', 'from-a')
    engine.set('b', 'x', 'from-b')
    expect(engine.get('a', 'x')).toBe('from-a')
    expect(engine.get('b', 'x')).toBe('from-b')
  })

  it('writes to localStorage with correct key format', () => {
    engine.set('app', 'key', 42)
    expect(localStorage.getItem('gf:app:key')).toBe('42')
  })

  it('reads from localStorage directly', () => {
    localStorage.setItem('gf:app:key', JSON.stringify('stored'))
    expect(engine.get('app', 'key')).toBe('stored')
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('gf:app:corrupt', '{bad')
    expect(engine.get('app', 'corrupt', 'fallback')).toBe('fallback')
  })

  it('subscribe receives notifications on set', () => {
    const received: { appId: string; key: string; value: unknown }[] = []
    engine.subscribe((appId, key, value) => { received.push({ appId, key, value }) })

    engine.set('app', 'key1', 'hello')
    engine.set('app', 'key2', 42)

    expect(received).toHaveLength(2)
    expect(received[0]).toEqual({ appId: 'app', key: 'key1', value: 'hello' })
    expect(received[1]).toEqual({ appId: 'app', key: 'key2', value: 42 })
  })

  it('subscribe receives notifications on remove', () => {
    const received: { appId: string; key: string; value: unknown }[] = []
    engine.subscribe((appId, key, value) => { received.push({ appId, key, value }) })

    engine.set('app', 'key', 'val')
    engine.remove('app', 'key')

    expect(received).toHaveLength(2)
    expect(received[1].value).toBeUndefined()
  })

  it('unsubscribe stops notifications', () => {
    const received: string[] = []
    const unsub = engine.subscribe(() => { received.push('called') })
    unsub()

    engine.set('app', 'key', 'val')
    expect(received).toHaveLength(0)
  })

  it('register adds namespace entry', () => {
    engine.register('myapp', 'key1')
    engine.register('myapp', 'key2')
    engine.register('otherapp', 'key3')

    const ns = engine.getRegisteredNamespaces()
    expect(ns).toHaveLength(2)
    expect(ns.find(n => n.appId === 'myapp')?.keys).toEqual(expect.arrayContaining(['key1', 'key2']))
    expect(ns.find(n => n.appId === 'otherapp')?.keys).toEqual(['key3'])
  })

  it('set auto-registers namespace', () => {
    engine.set('autoapp', 'autokey', 'val')
    const ns = engine.getRegisteredNamespaces()
    expect(ns).toHaveLength(1)
    expect(ns[0].appId).toBe('autoapp')
    expect(ns[0].keys).toEqual(['autokey'])
  })

  it('getAllState returns empty for no registrations', () => {
    expect(engine.getAllState()).toEqual({})
  })

  it('getAllState collects data from registered keys', () => {
    engine.set('app1', 'x', 1)
    engine.set('app1', 'y', 'hello')
    engine.set('app2', 'z', { nested: true })

    const state = engine.getAllState()
    expect(state.app1).toEqual({ x: 1, y: 'hello' })
    expect(state.app2).toEqual({ z: { nested: true } })
  })

  it('importState writes all entries and registers namespaces', () => {
    engine.importState({
      myapp: { greeting: 'hi', count: 42 },
      otherapp: { flag: true },
    })

    expect(engine.get('myapp', 'greeting')).toBe('hi')
    expect(engine.get('myapp', 'count')).toBe(42)
    expect(engine.get('otherapp', 'flag')).toBe(true)

    const ns = engine.getRegisteredNamespaces()
    expect(ns.find(n => n.appId === 'myapp')?.keys).toEqual(expect.arrayContaining(['greeting', 'count']))
  })

  it('importState writes to localStorage', () => {
    engine.importState({ app: { key: 'value' } })
    expect(JSON.parse(localStorage.getItem('gf:app:key')!)).toBe('value')
  })

  it('getAllState then importState round-trips correctly', () => {
    engine.set('roundtrip', 'a', [1, 2, 3])
    engine.set('roundtrip', 'b', { deep: true })

    const state = engine.getAllState()
    const engine2 = new StorageEngine()
    engine2.importState(state)

    expect(engine2.get('roundtrip', 'a')).toEqual([1, 2, 3])
    expect(engine2.get('roundtrip', 'b')).toEqual({ deep: true })
  })
})
