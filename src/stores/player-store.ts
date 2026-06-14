import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'

export interface QueueItem {
  id: string
  title: string
  subtitle?: string
  type: 'somafm' | 'moodist' | 'radio' | 'youtube'
}

export interface PlayerState {
  volume: number
  playingId: string | null
  playingTitle: string
  subtitle: string
  isPlaying: boolean
  isLoading: boolean
  type: QueueItem['type'] | null
  queue: QueueItem[]
  sleepTimer: number | null
}

export interface PlayerActions {
  play: (item: { id: string; title: string; subtitle?: string; type: QueueItem['type'] }) => void
  stop: () => void
  setVolume: (volume: number) => void
  setPlaying: (playing: boolean) => void
  setLoading: (loading: boolean) => void
  setPlayInfo: (title: string, subtitle: string) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (index: number) => void
  playNextFromQueue: () => void
  clearQueue: () => void
  setSleepTimer: (minutes: number) => void
  clearSleepTimer: () => void
}

type PlayerStore = PlayerState & PlayerActions

const storage = getStorage()

const persistedVolume = storage.get<number>('player:volume') ?? 0.5

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    volume: persistedVolume,
    playingId: null,
    playingTitle: '',
    subtitle: '',
    isPlaying: false,
    isLoading: false,
    type: null,
    queue: [],
    sleepTimer: null,

    play: (item) => {
      set({
        playingId: item.id,
        playingTitle: item.title,
        subtitle: item.subtitle ?? '',
        isPlaying: true,
        isLoading: true,
        type: item.type,
      })
    },

    stop: () => {
      set({
        playingId: null,
        playingTitle: '',
        subtitle: '',
        isPlaying: false,
        isLoading: false,
        type: null,
      })
    },

    setVolume: (volume) => {
      set({ volume })
      storage.set('player:volume', volume)
    },

    setPlaying: (playing) => set({ isPlaying: playing }),
    setLoading: (loading) => set({ isLoading: loading }),

    setPlayInfo: (title, subtitle) => {
      set({ playingTitle: title, subtitle })
    },

    addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),

    removeFromQueue: (index) =>
      set((state) => ({ queue: state.queue.filter((_, i) => i !== index) })),

    playNextFromQueue: () => {
      const { queue } = get()
      if (queue.length === 0) return
      const next = queue[0]!
      get().play(next)
      set({ queue: queue.slice(1) })
    },

    clearQueue: () => set({ queue: [] }),

    setSleepTimer: (minutes) => {
      set({ sleepTimer: Date.now() + minutes * 60_000 })
    },

    clearSleepTimer: () => set({ sleepTimer: null }),
  })),
)

// Atomic selectors — ogni selector ritorna un singolo valore stabile
export const usePlayerVolume = () => usePlayerStore((s) => s.volume)
export const usePlayerPlayingId = () => usePlayerStore((s) => s.playingId)
export const usePlayerPlayingTitle = () => usePlayerStore((s) => s.playingTitle)
export const usePlayerSubtitle = () => usePlayerStore((s) => s.subtitle)
export const usePlayerIsPlaying = () => usePlayerStore((s) => s.isPlaying)
export const usePlayerIsLoading = () => usePlayerStore((s) => s.isLoading)
export const usePlayerType = () => usePlayerStore((s) => s.type)
export const usePlayerQueue = () => usePlayerStore((s) => s.queue)
export const usePlayerSleepTimer = () => usePlayerStore((s) => s.sleepTimer)

// Action hooks individuali — ogni hook ritorna una singola funzione stabile
export const usePlayerPlay = () => usePlayerStore((s) => s.play)
export const usePlayerStop = () => usePlayerStore((s) => s.stop)
export const usePlayerSetVolume = () => usePlayerStore((s) => s.setVolume)
export const usePlayerSetPlaying = () => usePlayerStore((s) => s.setPlaying)
export const usePlayerSetLoading = () => usePlayerStore((s) => s.setLoading)
export const usePlayerSetPlayInfo = () => usePlayerStore((s) => s.setPlayInfo)
export const usePlayerAddToQueue = () => usePlayerStore((s) => s.addToQueue)
export const usePlayerRemoveFromQueue = () => usePlayerStore((s) => s.removeFromQueue)
export const usePlayerPlayNextFromQueue = () => usePlayerStore((s) => s.playNextFromQueue)
export const usePlayerClearQueue = () => usePlayerStore((s) => s.clearQueue)
export const usePlayerSetSleepTimer = () => usePlayerStore((s) => s.setSleepTimer)
export const usePlayerClearSleepTimer = () => usePlayerStore((s) => s.clearSleepTimer)
