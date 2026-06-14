import { describe, it, expect } from 'vitest'
import { generateId } from './id'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy()
  })

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('falls back when crypto.randomUUID throws', () => {
    const orig = crypto.randomUUID
    crypto.randomUUID = (() => { throw new Error('insecure context') }) as unknown as typeof crypto.randomUUID
    const id = generateId()
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
    crypto.randomUUID = orig
  })
})
