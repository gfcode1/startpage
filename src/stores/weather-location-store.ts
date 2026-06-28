import { create } from 'zustand'
import { getStorage } from '@/lib/storage/engine'

export interface City {
  lat: number
  lon: number
  name: string
}

interface LocationState {
  lat: number
  lon: number
  name: string
  geoLoading: boolean
  geoError: string | null
  recentCities: City[]
  setLocation: (lat: number, lon: number, name: string) => void
  addRecentCity: (city: City) => void
  removeRecentCity: (name: string) => void
  detectLocation: () => Promise<void>
  clearGeoError: () => void
}

function getInitialLocation(): { lat: number; lon: number; name: string } {
  try {
    const loc = getStorage().get<{ lat: number; lon: number; name: string }>('weather:location')
    if (loc && loc.lat !== 0 && loc.lon !== 0) return loc
  } catch {
    // storage not ready yet
  }
  return { lat: 41.9028, lon: 12.4964, name: 'Rome' }
}

function getRecentCities(): City[] {
  try {
    const cities = getStorage().get<City[]>('weather:recent')
    if (Array.isArray(cities)) return cities.slice(0, 5)
  } catch {
    // storage not ready
  }
  return []
}

function persistRecentCities(cities: City[]) {
  getStorage().set('weather:recent', cities)
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      { headers: { 'User-Agent': 'StartDeck/1.0' } },
    )
    if (!res.ok) throw new Error('Reverse geocode failed')
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}

export const useWeatherLocation = create<LocationState>((set, get) => ({
  ...getInitialLocation(),
  geoLoading: false,
  geoError: null,
  recentCities: getRecentCities(),

  setLocation: (lat, lon, name) => {
    set({ lat, lon, name })
    getStorage().set('weather:location', { lat, lon, name })
    const state = get()
    const filtered = state.recentCities.filter((c) => c.name !== name)
    filtered.unshift({ lat, lon, name })
    const trimmed = filtered.slice(0, 5)
    set({ recentCities: trimmed })
    persistRecentCities(trimmed)
  },

  addRecentCity: (city) => {
    const filtered = get().recentCities.filter((c) => c.name !== city.name)
    filtered.unshift(city)
    const trimmed = filtered.slice(0, 5)
    set({ recentCities: trimmed })
    persistRecentCities(trimmed)
  },

  removeRecentCity: (name) => {
    const trimmed = get().recentCities.filter((c) => c.name !== name)
    set({ recentCities: trimmed })
    persistRecentCities(trimmed)
  },

  detectLocation: async () => {
    if (!navigator.geolocation) {
      set({ geoError: 'Geolocation not supported' })
      return
    }
    set({ geoLoading: true, geoError: null })
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000,
        })
      })
      const { latitude, longitude } = position.coords
      const name = await reverseGeocode(latitude, longitude)
      get().setLocation(latitude, longitude, name)
      set({ geoLoading: false })
    } catch (err) {
      const msg = err instanceof GeolocationPositionError
        ? err.code === GeolocationPositionError.PERMISSION_DENIED ? 'Location denied' : 'Location unavailable'
        : 'Geolocation failed'
      set({ geoError: msg, geoLoading: false })
    }
  },

  clearGeoError: () => set({ geoError: null }),
}))

import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const loc = storage.get<{ lat: number; lon: number; name: string }>('weather:location')
  if (loc) {
    const state = useWeatherLocation.getState()
    if (state.lat !== loc.lat || state.lon !== loc.lon) {
      useWeatherLocation.setState(loc)
    }
  }
  const recent = storage.get<City[]>('weather:recent')
  if (Array.isArray(recent)) {
    useWeatherLocation.setState({ recentCities: recent.slice(0, 5) })
  }
})
