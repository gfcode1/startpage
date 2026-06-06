import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('useLocalStorage', () => {
  it('returns initial value when nothing stored', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('stores and retrieves a value', () => {
    const { result } = renderHook(() => useLocalStorage('test', ''))
    act(() => { result.current[1]('stored') })
    expect(result.current[0]).toBe('stored')
    expect(JSON.parse(localStorage.getItem('test')!)).toBe('stored')
  })

  it('loads existing value from localStorage', () => {
    localStorage.setItem('preload', JSON.stringify('existing'))
    const { result } = renderHook(() => useLocalStorage('preload', 'default'))
    expect(result.current[0]).toBe('existing')
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('corrupt', '{bad')
    const { result } = renderHook(() => useLocalStorage('corrupt', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('supports function updater', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0))
    act(() => { result.current[1](prev => prev + 1) })
    expect(result.current[0]).toBe(1)
  })

  it('handles array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arr', []))
    act(() => { result.current[1](['a', 'b']) })
    expect(result.current[0]).toEqual(['a', 'b'])
    act(() => { result.current[1](prev => [...prev, 'c']) })
    expect(result.current[0]).toEqual(['a', 'b', 'c'])
  })
})
