import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStorage } from './useAppStorage'

describe('useAppStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when empty', () => {
    const { result } = renderHook(() => useAppStorage('testapp', 'key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('gf:testapp:key', JSON.stringify('stored'))
    const { result } = renderHook(() => useAppStorage('testapp', 'key', 'default'))
    expect(result.current[0]).toBe('stored')
  })

  it('writes to localStorage when setter is called', () => {
    const { result } = renderHook(() => useAppStorage('testapp', 'key', ''))
    act(() => { result.current[1]('hello') })
    expect(JSON.parse(localStorage.getItem('gf:testapp:key')!)).toBe('hello')
  })

  it('updates state when setter is called', () => {
    const { result } = renderHook(() => useAppStorage('testapp', 'key', ''))
    act(() => { result.current[1]('hello') })
    expect(result.current[0]).toBe('hello')
  })

  it('migrates from old key format on first read', () => {
    localStorage.setItem('gf-testapp-key', JSON.stringify('migrated'))
    const { result } = renderHook(() => useAppStorage('testapp', 'key', 'default'))
    expect(result.current[0]).toBe('migrated')
    expect(localStorage.getItem('gf-testapp-key')).toBeNull()
    expect(JSON.parse(localStorage.getItem('gf:testapp:key')!)).toBe('migrated')
  })

  it('does not migrate if new key already exists', () => {
    localStorage.setItem('gf-testapp-key', JSON.stringify('old'))
    localStorage.setItem('gf:testapp:key', JSON.stringify('new'))
    const { result } = renderHook(() => useAppStorage('testapp', 'key', 'default'))
    expect(result.current[0]).toBe('new')
    expect(JSON.parse(localStorage.getItem('gf-testapp-key')!)).toBe('old')
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('gf:testapp:corrupt', '{bad')
    const { result } = renderHook(() => useAppStorage('testapp', 'corrupt', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('supports function updater', () => {
    const { result } = renderHook(() => useAppStorage('testapp', 'counter', 0))
    act(() => { result.current[1](prev => prev + 1) })
    expect(result.current[0]).toBe(1)
    act(() => { result.current[1](prev => prev + 1) })
    expect(result.current[0]).toBe(2)
  })

  it('supports object values', () => {
    const { result } = renderHook(() => useAppStorage('testapp', 'data', { a: 1 }))
    act(() => { result.current[1]({ a: 2, b: 'hi' }) })
    expect(result.current[0]).toEqual({ a: 2, b: 'hi' })
    expect(JSON.parse(localStorage.getItem('gf:testapp:data')!)).toEqual({ a: 2, b: 'hi' })
  })

  it('registers namespace on mount', () => {
    const { result, unmount } = renderHook(() => useAppStorage('regapp', 'regkey', 'val'))
    // First render should register
    expect(result.current[0]).toBe('val')
    unmount()
  })
})
