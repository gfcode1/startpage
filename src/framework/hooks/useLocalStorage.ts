import { useState, useCallback, Dispatch, SetStateAction } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (e) {
      console.warn('useLocalStorage: read failed', e)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch (e) { console.warn('useLocalStorage: write failed', e) }
      return next
    })
  }, [key])

  return [storedValue, setValue]
}
