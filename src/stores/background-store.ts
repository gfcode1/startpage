import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'

interface BackgroundState {
  backgroundType: 'none' | 'solid' | 'image'
  backgroundColor: string
  backgroundImage: string
  picsumSeed: string | null
}

interface BackgroundActions {
  setBackgroundType: (type: 'none' | 'solid' | 'image') => void
  setBackgroundColor: (color: string) => void
  setBackgroundImage: (url: string) => void
  setPicsumSeed: (seed: string | null) => void
  resetBackground: () => void
}

type BackgroundStore = BackgroundState & BackgroundActions

const initialState: BackgroundState = {
  backgroundType: 'none',
  backgroundColor: '#241d1a',
  backgroundImage: '',
  picsumSeed: null,
}

export const useBackgroundStore = create<BackgroundStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setBackgroundType: (type) => set({ backgroundType: type }),
    setBackgroundColor: (color) => set({ backgroundColor: color }),
    setBackgroundImage: (url) => set({ backgroundImage: url }),
    setPicsumSeed: (seed) => set({ picsumSeed: seed }),
    resetBackground: () => set(initialState),
  })),
)

useBackgroundStore.subscribe((state) => {
  if (getIsRehydrating()) return
  getStorage().set('background', {
    backgroundType: state.backgroundType,
    backgroundColor: state.backgroundColor,
    backgroundImage: state.backgroundImage?.startsWith('data:')
      ? ''
      : state.backgroundImage,
    picsumSeed: state.picsumSeed,
  })
})

import { getIsRehydrating, registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const saved = storage.get<BackgroundState>('background')
  if (!saved) return
  const restored = { ...initialState, ...saved }
  if (restored.backgroundType === 'image' && !restored.backgroundImage && restored.picsumSeed) {
    restored.backgroundImage = `https://picsum.photos/seed/${restored.picsumSeed}/1920/1080`
  }
  if (restored.backgroundType === 'image' && !restored.backgroundImage && !restored.picsumSeed) {
    restored.backgroundType = 'none'
  }
  useBackgroundStore.setState(restored)
})
