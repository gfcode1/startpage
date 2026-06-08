import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react'
import { useAppStorage } from './persistence/useAppStorage'

export interface QueueItem {
  id: string
  title: string
  subtitle?: string
  type: string
}

interface PlayerState {
  volume: number
  playingId: string | null
  playingTitle: string
  subtitle: string
  isPlaying: boolean
  isLoading: boolean
  type: string | null
  queue: QueueItem[]
  sleepTimer: number | null
}

interface PlayerActions {
  play: (opts: { id: string; title: string; subtitle?: string; type: string }) => void
  setPlaying: (playing: boolean) => void
  setLoading: (loading: boolean) => void
  setPlayInfo: (title: string, subtitle?: string) => void
  stop: () => void
  setVolume: (volume: number) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (index: number) => void
  playNextFromQueue: () => QueueItem | null
  clearQueue: () => void
  setSleepTimer: (minutes: number | null) => void
}

type PlayerContextValue = PlayerState & PlayerActions

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerPrefs, setPlayerPrefs] = useAppStorage<{ volume: number }>('_framework', 'player', { volume: 0.75 })
  const [transient, setTransient] = useState<Omit<PlayerState, 'volume'>>({
    playingId: null,
    playingTitle: '',
    isPlaying: false,
    isLoading: false,
    subtitle: '',
    type: null,
    queue: [],
    sleepTimer: null,
  })
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const play = useCallback(({ id, title, subtitle, type }: { id: string; title: string; subtitle?: string; type: string }) => {
    setTransient(prev => ({ ...prev, playingId: id, playingTitle: title, subtitle: subtitle || '', type, isPlaying: true, isLoading: true }))
  }, [])

  const setPlaying = useCallback((isPlaying: boolean) => {
    setTransient(prev => ({ ...prev, isPlaying }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setTransient(prev => ({ ...prev, isLoading }))
  }, [])

  const stop = useCallback(() => {
    setTransient(prev => ({ ...prev, playingId: null, playingTitle: '', subtitle: '', isPlaying: false, isLoading: false, type: null }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    setPlayerPrefs({ volume })
  }, [setPlayerPrefs])

  const setPlayInfo = useCallback((title: string, subtitle?: string) => {
    setTransient(prev => ({ ...prev, playingTitle: title, subtitle: subtitle || '' }))
  }, [])

  const addToQueue = useCallback((item: QueueItem) => {
    setTransient(prev => ({ ...prev, queue: [...prev.queue, item] }))
  }, [])

  const removeFromQueue = useCallback((index: number) => {
    setTransient(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index),
    }))
  }, [])

  const playNextFromQueue = useCallback(() => {
    let next: QueueItem | null = null
    setTransient(prev => {
      if (prev.queue.length === 0) return prev
      next = prev.queue[0]
      return { ...prev, queue: prev.queue.slice(1) }
    })
    return next
  }, [])

  const clearQueue = useCallback(() => {
    setTransient(prev => ({ ...prev, queue: [] }))
  }, [])

  const setSleepTimer = useCallback((minutes: number | null) => {
    setTransient(prev => ({
      ...prev,
      sleepTimer: minutes !== null ? Date.now() + minutes * 60 * 1000 : null,
    }))
  }, [])

  useEffect(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current)
      sleepTimerRef.current = null
    }

    if (!transient.sleepTimer || !transient.playingId) return

    sleepTimerRef.current = setInterval(() => {
      if (Date.now() >= transient.sleepTimer!) {
        stop()
        setTransient(prev => ({ ...prev, sleepTimer: null }))
        if (sleepTimerRef.current) {
          clearInterval(sleepTimerRef.current)
          sleepTimerRef.current = null
        }
      }
    }, 10000)

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current)
        sleepTimerRef.current = null
      }
    }
  }, [transient.sleepTimer, transient.playingId, stop])

  const value = useMemo<PlayerContextValue>(() => ({
    ...transient,
    volume: playerPrefs.volume,
    play,
    setPlaying,
    setLoading,
    setPlayInfo,
    stop,
    setVolume,
    addToQueue,
    removeFromQueue,
    playNextFromQueue,
    clearQueue,
    setSleepTimer,
  }), [transient, playerPrefs.volume, play, setPlaying, setLoading, setPlayInfo, stop, setVolume, addToQueue, removeFromQueue, playNextFromQueue, clearQueue, setSleepTimer])

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
