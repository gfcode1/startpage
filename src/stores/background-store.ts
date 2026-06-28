import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'

interface ArticArtwork {
  id: number
  title: string
  artist: string
  imageId: string
}

interface BackgroundState {
  backgroundType: 'none' | 'solid' | 'image'
  backgroundColor: string
  backgroundImage: string
  articArtwork: ArticArtwork | null
}

interface BackgroundActions {
  setBackgroundType: (type: 'none' | 'solid' | 'image') => void
  setBackgroundColor: (color: string) => void
  setBackgroundImage: (url: string) => void
  setArticArtwork: (artwork: ArticArtwork | null) => void
  resetBackground: () => void
}

type BackgroundStore = BackgroundState & BackgroundActions

const initialState: BackgroundState = {
  backgroundType: 'none',
  backgroundColor: '#241d1a',
  backgroundImage: '',
  articArtwork: null,
}

export const useBackgroundStore = create<BackgroundStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setBackgroundType: (type) => set({ backgroundType: type }),
    setBackgroundColor: (color) => set({ backgroundColor: color }),
    setBackgroundImage: (url) => set({ backgroundImage: url }),
    setArticArtwork: (artwork) => set({ articArtwork: artwork }),
    resetBackground: () => set(initialState),
  })),
)

useBackgroundStore.subscribe((state) => {
  if (getIsRehydrating()) return
  getStorage().set('background', {
    backgroundType: state.backgroundType,
    backgroundColor: state.backgroundColor,
    backgroundImage: state.backgroundImage,
    articArtwork: state.articArtwork,
  })
})

const ARTIC_IIIF_PREFIX = 'https://www.artic.edu/iiif/'
function migrateArticUrl(url: string): string {
  if (url.startsWith(ARTIC_IIIF_PREFIX)) {
    return url.replace(ARTIC_IIIF_PREFIX, '/iiif-proxy/')
  }
  return url
}

import { getIsRehydrating, registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const saved = storage.get<BackgroundState>('background')
  if (saved) {
    useBackgroundStore.setState({
      ...initialState,
      ...saved,
      backgroundImage: migrateArticUrl(saved.backgroundImage),
    })
  }
})
