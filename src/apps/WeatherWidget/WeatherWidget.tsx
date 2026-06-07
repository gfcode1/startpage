import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './WeatherWidget.css'

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast'

interface CurrentWeather {
  temperature_2m: number
  weather_code: number
  apparent_temperature: number
  relative_humidity_2m: number
  wind_speed_10m: number
}

interface DailyWeather {
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
}

interface WeatherData {
  current: CurrentWeather
  daily: DailyWeather
}


function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mostly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Fog'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 75) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Clear'
}

export default function WeatherWidget() {
  const navigate = useNavigate()
  const [city] = useAppStorage<string>('weather', 'city', '')
  const [coords] = useAppStorage<{ lat: number; lon: number } | null>('weather', 'coords', null)
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!coords) return

    let cancelled = false
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          latitude: coords.lat.toString(),
          longitude: coords.lon.toString(),
          current: 'temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
          forecast_days: '1',
        })
        const res = await fetch(`${WEATHER_BASE}?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }

    fetchData()
    const id = setInterval(fetchData, 10 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [coords])

  if (!city || !coords) {
    return (
      <div className="gf-widget-weather">
        <button className="gf-widget-weather__action" onClick={() => navigate('/weather')}>
          Set a city in Weather
          <GfIcon name="chevron-right" size={12} />
        </button>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="gf-widget-weather">
        <span className="gf-widget-weather__empty">Weather unavailable</span>
      </div>
    )
  }

  if (!data) {
    return <div className="gf-widget-weather gf-widget-weather--loading">—</div>
  }

  const { current, daily } = data
  const temp = Math.round(current.temperature_2m)
  const feels = Math.round(current.apparent_temperature)
  const label = getWeatherLabel(current.weather_code)

  return (
    <div className="gf-widget-weather">
      <div className="gf-widget-weather__main">
        <span className="gf-widget-weather__emoji"><GfIcon name="sun" size={28} /></span>
        <span className="gf-widget-weather__temp">{temp}°</span>
        <span className="gf-widget-weather__city">{city}</span>
      </div>
      <span className="gf-widget-weather__condition">
        {label} · Feels {feels}°
      </span>
      <div className="gf-widget-weather__details">
        <span className="gf-widget-weather__detail">
          <GfIcon name="droplet" size={10} /> {current.relative_humidity_2m}%
        </span>
        <span className="gf-widget-weather__detail">
          <GfIcon name="wind" size={10} /> {Math.round(current.wind_speed_10m)} km/h
        </span>
        <span className="gf-widget-weather__detail">
          <GfIcon name="temperature" size={10} /> H:{Math.round(daily.temperature_2m_max[0])}° L:{Math.round(daily.temperature_2m_min[0])}°
        </span>
      </div>
    </div>
  )
}
