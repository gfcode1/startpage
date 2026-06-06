import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { searchCity, fetchWeather, getPosition } from './api'
import { getWeatherInfo, isNightTime } from './weatherCodes'
import type { CityResult, WeatherData } from './types'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './WeatherApp.css'

const APP_ID = 'weather'
const DEFAULT_COORDS = { lat: 41.9028, lon: 12.4964 }
const DEFAULT_CITY = 'Roma'
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  const d = new Date(dateStr + 'T12:00:00')
  return DAY_NAMES[d.getDay()]
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function generateRaindrops() {
  return Array.from({ length: 20 }, () => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${0.5 + Math.random() * 0.5}s`,
  }))
}

export default function WeatherApp() {
  const [savedCity, setSavedCity] = useAppStorage<string>(APP_ID, 'city', DEFAULT_CITY)
  const [savedCoords, setSavedCoords] = useAppStorage<{ lat: number; lon: number }>(APP_ID, 'coords', DEFAULT_COORDS)

  const [city, setCity] = useState(savedCity)
  const [country, setCountry] = useState('')
  const [coords, setCoords] = useState(savedCoords)
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CityResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [retryKey, setRetryKey] = useState(0)

  const searchRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isNight = useMemo(() => {
    if (!data) return false
    const today = data.daily
    if (today.sunrise[0] && today.sunset[0]) {
      return isNightTime(today.sunrise[0], today.sunset[0])
    }
    return false
  }, [data])

  const weatherInfo = useMemo(() => {
    if (!data) return null
    const code = data.current.weather_code
    return getWeatherInfo(code, isNight)
  }, [data, isNight])

  const raindrops = useMemo(() => generateRaindrops(), [])

  useEffect(() => {
    const ctrl = new AbortController()

    fetchWeather(coords.lat, coords.lon, ctrl.signal)
      .then(result => {
        if (!ctrl.signal.aborted) {
          setData(result)
          setLoading(false)
          setSearchQuery('')
        }
      })
      .catch(err => {
        if (
          !ctrl.signal.aborted &&
          !(err instanceof DOMException && err.name === 'AbortError')
        ) {
          setError('Weather service temporarily unavailable (502). Open-Meteo API may be under maintenance.')
          setLoading(false)
        }
      })
    return () => ctrl.abort()
  }, [coords.lat, coords.lon, retryKey])

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      if (controller.signal.aborted) return

      if (searchQuery.length < 2) {
        setSearchResults([])
        setShowResults(false)
        setSearching(false)
        return
      }

      setSearching(true)

      try {
        const results = await searchCity(searchQuery, controller.signal)
        if (!controller.signal.aborted) {
          setSearchResults(results)
          setShowResults(results.length > 0)
          setSearching(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([])
          setShowResults(false)
          setSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleGeoRequest = useCallback(async () => {
    setGeoLoading(true)
    setError(null)
    try {
      const pos = await getPosition()
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      setSavedCoords({ lat, lon })
      setCoords({ lat, lon })
      setCity('Current location')
      setCountry('')
    } catch {
      setError('Unable to get location. Enable geolocation or search for a city.')
      setGeoLoading(false)
    } finally {
      setGeoLoading(false)
    }
  }, [setSavedCoords])

  const selectCity = useCallback((result: CityResult) => {
    setLoading(true)
    setError(null)
    setCity(result.name)
    setCountry(result.country)
    const newCoords = { lat: result.latitude, lon: result.longitude }
    setSavedCoords(newCoords)
    setSavedCity(result.name)
    setCoords(newCoords)
    setShowResults(false)
  }, [setSavedCoords, setSavedCity])

  const showRain = data && data.current.weather_code >= 61 && data.current.weather_code <= 82
  const showLightning = data && data.current.weather_code >= 95

  const showErrorPage = error && !data

  if (showErrorPage) {
    return (
      <div className="gf-weather">
        <div className="gf-weather__search" ref={searchRef}>
          <div className="gf-weather__search-bar">
            <svg className="gf-weather__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="gf-weather__search-input"
              type="text"
              placeholder="Search city..."
              aria-label="Search city"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            <button
              className={`gf-weather__geo-btn ${geoLoading ? 'gf-weather__geo-btn--loading' : ''}`}
              onClick={handleGeoRequest}
              disabled={geoLoading}
               aria-label="Current location"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {searching && (
              <div className="gf-weather__search-dropdown">
                <div className="gf-weather__search-loading">Searching...</div>
              </div>
            )}
            {!searching && searchResults.length > 0 && showResults && (
              <div className="gf-weather__search-dropdown">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    className="gf-weather__search-item"
                    onClick={() => selectCity(r)}
                  >
                    <span className="gf-weather__search-item-name">
                      {r.name}{r.admin1 ? `, ${r.admin1}` : ''}
                    </span>
                    <span className="gf-weather__search-item-country">{r.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="gf-weather__error-state">
          <p className="gf-weather__error-text">{error}</p>
          <button className="gf-weather__retry-btn" onClick={() => { setLoading(true); setError(null); setRetryKey(k => k + 1); }}>
            Retry
          </button>
          <button className="gf-weather__retry-btn gf-weather__retry-btn--secondary" onClick={handleGeoRequest}>
            Use location
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-weather">
      <h1 className="gf-sr-only">Weather</h1>
      <div className="gf-weather__search" ref={searchRef}>
        <div className="gf-weather__search-bar">
          <svg className="gf-weather__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="gf-weather__search-input"
            type="text"
            placeholder="Search city..."
            aria-label="Search city"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          <button
            className={`gf-weather__geo-btn ${geoLoading ? 'gf-weather__geo-btn--loading' : ''}`}
            onClick={handleGeoRequest}
            disabled={geoLoading}
               aria-label="Current location"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
            {searching && (
              <div className="gf-weather__search-dropdown">
                <div className="gf-weather__search-loading">Searching...</div>
              </div>
            )}
            {!searching && searchResults.length > 0 && showResults && (
              <div className="gf-weather__search-dropdown">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    className="gf-weather__search-item"
                    onClick={() => selectCity(r)}
                  >
                    <span className="gf-weather__search-item-name">
                      {r.name}{r.admin1 ? `, ${r.admin1}` : ''}
                    </span>
                    <span className="gf-weather__search-item-country">{r.country}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {error && data && (
        <div className="gf-weather__error-banner">{error}</div>
      )}

      {loading ? (
        <div className="gf-weather__skeleton">
          <div className="gf-weather__skeleton-hero">
            <div className="gf-weather__skeleton-circle" />
            <div className="gf-weather__skeleton-lines">
              <div className="gf-weather__skeleton-line gf-weather__skeleton-line--lg" />
              <div className="gf-weather__skeleton-line" />
              <div className="gf-weather__skeleton-line gf-weather__skeleton-line--sm" />
            </div>
          </div>
          <div className="gf-weather__skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="gf-weather__skeleton-card" />
            ))}
          </div>
          <div className="gf-weather__skeleton-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="gf-weather__skeleton-day" />
            ))}
          </div>
        </div>
      ) : data && weatherInfo ? (
        <>
          <div
            className="gf-weather__hero"
            style={{ background: weatherInfo.gradient }}
          >
            <div className="gf-weather__hero-bg">
              {showRain && (
                <div className="gf-weather__rain">
                  {raindrops.map((drop, i) => (
                    <span key={i} className="gf-weather__raindrop" style={{
                      left: drop.left,
                      animationDelay: drop.delay,
                      animationDuration: drop.duration,
                    }} />
                  ))}
                </div>
              )}
              {showLightning && <div className="gf-weather__lightning" />}
            </div>
            <div className="gf-weather__hero-content">
              <div className="gf-weather__city-section">
                <h2 className="gf-weather__city">
                  {city}
                  {country && <span className="gf-weather__country">, {country}</span>}
                </h2>
                <p className="gf-weather__condition">{weatherInfo.label}</p>
              </div>
              <div className="gf-weather__temp-section">
                <span className="gf-weather__icon">{weatherInfo.icon}</span>
                <span className="gf-weather__temp">
                  {Math.round(data.current.temperature_2m)}°
                </span>
              </div>
              <div className="gf-weather__feels">
                Feels like {Math.round(data.current.apparent_temperature)}°
              </div>
            </div>
          </div>

          <div className="gf-weather__details">
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon">💧</div>
              <div className="gf-weather__detail-value">{data.current.relative_humidity_2m}%</div>
              <div className="gf-weather__detail-label">Humidity</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon">🌬️</div>
              <div className="gf-weather__detail-value">{Math.round(data.current.wind_speed_10m)} km/h</div>
              <div className="gf-weather__detail-label">Wind</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon">🌀</div>
              <div className="gf-weather__detail-value">{Math.round(data.current.pressure_msl)} hPa</div>
              <div className="gf-weather__detail-label">Pressure</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon">🌅</div>
              <div className="gf-weather__detail-value">
                {data.daily.sunrise[0] ? formatTime(data.daily.sunrise[0]) : '--'}
              </div>
              <div className="gf-weather__detail-label">Sunrise / Sunset</div>
              <div className="gf-weather__detail-sub">
                {data.daily.sunset[0] ? formatTime(data.daily.sunset[0]) : '--'}
              </div>
            </div>
          </div>

          <div className="gf-weather__forecast">
            <h3 className="gf-weather__forecast-title">7-Day Forecast</h3>
            <div className="gf-weather__forecast-list">
              {data.daily.time.map((dateStr, i) => {
                const dayCode = data.daily.weather_code[i]
                const dayInfo = getWeatherInfo(dayCode, false)
                const maxT = Math.round(data.daily.temperature_2m_max[i])
                const minT = Math.round(data.daily.temperature_2m_min[i])
                const precip = data.daily.precipitation_probability_max[i]
                const allMax = Math.max(...data.daily.temperature_2m_max)
                const allMin = Math.min(...data.daily.temperature_2m_min)
                const range = allMax - allMin || 1
                const barLeft = ((minT - allMin) / range) * 100
                const barWidth = ((maxT - minT) / range) * 100

                return (
                  <div key={dateStr} className="gf-weather__day" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className="gf-weather__day-name">{formatDay(dateStr, i)}</span>
                    <span className="gf-weather__day-icon">{dayInfo.icon}</span>
                    <div className="gf-weather__day-temps">
                      <span className="gf-weather__day-min">{minT}°</span>
                      <div className="gf-weather__day-bar-track">
                        <div
                          className="gf-weather__day-bar"
                          style={{
                            left: `${barLeft}%`,
                            width: `${Math.max(barWidth, 4)}%`,
                          }}
                        />
                      </div>
                      <span className="gf-weather__day-max">{maxT}°</span>
                    </div>
                    {precip !== undefined && precip > 0 && (
                      <span className="gf-weather__day-precip">
                        <span className="gf-weather__day-precip-icon">💧</span>
                        {precip}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
