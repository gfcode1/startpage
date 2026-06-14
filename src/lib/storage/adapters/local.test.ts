import { describe, it, expect, beforeEach } from 'vitest'
import { createLocalAdapter } from './local'

describe('createLocalAdapter', () => {
  let adapter: ReturnType<typeof createLocalAdapter>

  beforeEach(() => {
    localStorage.clear()
    adapter = createLocalAdapter()
  })

  it('set and get a value', () => {
    adapter.set('test-key', { hello: 'world' })
    const val = adapter.get<{ hello: string }>('test-key')
    expect(val).toEqual({ hello: 'world' })
  })

  it('returns null for missing key', () => {
    expect(adapter.get('nonexistent')).toBeNull()
  })

  it('remove a key', () => {
    adapter.set('test', 42)
    adapter.remove('test')
    expect(adapter.get('test')).toBeNull()
  })

  it('notifies subscribers on set', () => {
    const calls: unknown[] = []
    adapter.subscribe('test', (v) => calls.push(v))
    adapter.set('test', { a: 1 })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({ a: 1 })
  })

  it('does not throw on localStorage quota error', () => {
    // Mock setItem to throw
    const orig = localStorage.setItem
    localStorage.setItem = () => { throw new DOMException('QuotaExceededError') }
    expect(() => adapter.set('key', 'value')).not.toThrow()
    localStorage.setItem = orig
  })
})
