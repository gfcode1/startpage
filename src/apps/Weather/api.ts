import type { CityResult, WeatherData } from './types'

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast'

export async function searchCity(
  query: string,
  signal?: AbortSignal,
): Promise<CityResult[]> {
  if (!query || query.length < 2) return []

  const url = `${GEO_BASE}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
  const res = await fetch(url, { signal })

  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`)
  }

  const json = await res.json()
  return (json.results ?? []) as CityResult[]
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
  })

  const url = `${WEATHER_BASE}?${params}`
  const res = await fetch(url, { signal })

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`)
  }

  return res.json() as Promise<WeatherData>
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    })
  })
}
