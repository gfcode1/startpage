import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react'
import { persistenceService } from './PersistenceService'
import type { GameSaveData } from '../storage/types'

const PREFIX = 'gf'

function storageKey(appId: string, key: string): string {
  return `${PREFIX}:${appId}:${key}`
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
  } catch {
    // silent
  }
}

export function useAppStorage<T>(
  appId: string,
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const registered = useRef(false)

  useEffect(() => {
    if (!registered.current) {
      persistenceService.registerNamespace(appId, key)
      registered.current = true
    }
    return () => {
      persistenceService.unregisterKey(appId, key)
      registered.current = false
    }
  }, [appId, key])

  const [storedValue, setStoredValue] = useState<T>(() => {
    tryMigrate(appId, key)
    const raw = localStorage.getItem(storageKey(appId, key))
    if (raw !== null) {
      try { return JSON.parse(raw) as T } catch { /* fall through */ }
    }
    return initialValue
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
      try {
        localStorage.setItem(storageKey(appId, key), JSON.stringify(next))
      } catch { /* empty */ }
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
