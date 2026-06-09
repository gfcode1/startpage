import { useState, useCallback, Dispatch, SetStateAction } from 'react'
import { storageEngine } from '../storage/StorageEngine'
import type { GameSaveData } from '../storage/types'

function storageKey(appId: string, key: string): string {
  return `gf:${appId}:${key}`
}

function tryMigrate(appId: string, key: string): void {
  const oldKey = `gf-${appId}-${key}`
  const newKey = storageKey(appId, key)
  try {
    const oldVal = localStorage.getItem(oldKey)
    if (oldVal !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldVal)
      localStorage.removeItem(oldKey)
    }
  } catch (e) {
    console.warn(`useAppStorage: migration failed for ${appId}:${key}`, e)
  }
}

export function useAppStorage<T>(
  appId: string,
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    tryMigrate(appId, key)
    const val = storageEngine.get<T>(appId, key)
    return val !== undefined ? val : initialValue
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
      storageEngine.set(appId, key, next)
      return next
    })
  }, [appId, key])

  return [storedValue, setValue]
}

export function useAppSaveData<T>(
  appId: string,
  key: string,
): [GameSaveData<T> | null, (state: T) => void, () => void] {
  const [data, setData] = useAppStorage<GameSaveData<T> | null>(appId, key, null)

  const save = useCallback((state: T) => {
    setData({
      version: 1,
      timestamp: Date.now(),
      state,
    })
  }, [setData])

  const clear = useCallback(() => {
    setData(null)
  }, [setData])

  return [data, save, clear]
}
