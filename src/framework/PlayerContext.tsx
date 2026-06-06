import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useAppStorage } from './persistence/useAppStorage'

interface PlayerState {
  volume: number
  playingId: string | null
  playingTitle: string
  subtitle: string
  isPlaying: boolean
  isLoading: boolean
  type: 'soma' | 'youtube' | 'radiobrowser' | null
}

interface PlayerActions {
  play: (opts: { id: string; title: string; subtitle?: string; type: 'soma' | 'youtube' | 'radiobrowser' }) => void
  setPlaying: (playing: boolean) => void
  setLoading: (loading: boolean) => void
  setPlayInfo: (title: string, subtitle?: string) => void
  stop: () => void
  setVolume: (volume: number) => void
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
  })

  const play = useCallback(({ id, title, subtitle, type }: { id: string; title: string; subtitle?: string; type: 'soma' | 'youtube' | 'radiobrowser' }) => {
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

  const value = useMemo<PlayerContextValue>(() => ({
    ...transient,
    volume: playerPrefs.volume,
    play,
    setPlaying,
    setLoading,
    setPlayInfo,
    stop,
    setVolume,
  }), [transient, playerPrefs.volume, play, setPlaying, setLoading, setPlayInfo, stop, setVolume])

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
