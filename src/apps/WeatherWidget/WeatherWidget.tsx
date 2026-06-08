import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon, type IconName } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { getWeatherInfo } from '../Weather/weatherCodes'
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

export default function WeatherWidget() {
  const navigate = useNavigate()
  const [city] = useAppStorage<string>('weather', 'city', '')
  const [coords] = useAppStorage<{ lat: number; lon: number } | null>('weather', 'coords', null)
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!coords) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          latitude: coords.lat.toString(),
          longitude: coords.lon.toString(),
          current: 'temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
          forecast_days: '1',
        })
        const res = await fetch(`${WEATHER_BASE}?${params}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!controller.signal.aborted) {
          setData(json)
          setError(false)
        }
      } catch (err) {
        if (
          !controller.signal.aborted &&
          !(err instanceof DOMException && err.name === 'AbortError')
        ) {
          setError(true)
        }
      }
    }

    fetchData()
    const id = setInterval(fetchData, 10 * 60 * 1000)
    return () => {
      controller.abort()
      clearInterval(id)
    }
  }, [coords, retryKey])

  if (!city || !coords) {
    return (
      <div className="gf-widget-weather">
        <GfWidgetAction label="Set a city in Weather" onClick={() => navigate('/weather')} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="gf-widget-weather gf-widget-weather--loading">
        <span className="gf-widget-weather__empty">Weather unavailable</span>
        <button className="gf-widget-weather__retry" onClick={() => setRetryKey(k => k + 1)}>
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="gf-widget-weather">
        <div className="gf-widget-weather__skeleton">
          <div className="gf-widget-weather__skeleton-row">
            <div className="gf-widget-weather__skeleton-circle" />
            <div className="gf-widget-weather__skeleton-line gf-widget-weather__skeleton-line--lg" />
            <div className="gf-widget-weather__skeleton-line gf-widget-weather__skeleton-line--sm" />
          </div>
          <div className="gf-widget-weather__skeleton-details">
            <div className="gf-widget-weather__skeleton-line" />
            <div className="gf-widget-weather__skeleton-line" />
            <div className="gf-widget-weather__skeleton-line" />
          </div>
        </div>
      </div>
    )
  }

  const { current, daily } = data
  const temp = Math.round(current.temperature_2m)
  const feels = Math.round(current.apparent_temperature)
  const info = getWeatherInfo(current.weather_code, false)

  return (
    <div className="gf-widget-weather">
      <div className="gf-widget-weather__main">
        <span className="gf-widget-weather__emoji"><GfIcon name={info.icon as IconName} size={28} /></span>
        <span className="gf-widget-weather__temp">{temp}°</span>
        <span className="gf-widget-weather__city">{city}</span>
      </div>
      <span className="gf-widget-weather__condition">
        {info.label} · Feels {feels}°
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
