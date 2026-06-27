import { create } from 'zustand'
import { getStorage } from '@/lib/storage/engine'

interface LocationState {
  lat: number
  lon: number
  name: string
  setLocation: (lat: number, lon: number, name: string) => void
}

export const useWeatherLocation = create<LocationState>((set) => ({
  lat: 41.9028,
  lon: 12.4964,
  name: 'Rome',
  setLocation: (lat, lon, name) => {
    set({ lat, lon, name })
    getStorage().set('weather:location', { lat, lon, name })
  },
}))

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const loc = storage.get<{ lat: number; lon: number; name: string }>('weather:location')
  if (loc) useWeatherLocation.setState(loc)
})
