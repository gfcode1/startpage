import { create } from 'zustand'

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
  setLocation: (lat, lon, name) => set({ lat, lon, name }),
}))
