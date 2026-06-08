import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { GfIcon, type IconName } from '../../framework/iconSystem'
import { useTopbar } from '../../framework/TopbarContext'
import { searchCity, fetchWeather, fetchHistoricalWeather, getPosition } from './api'
import { getWeatherInfo, isNightTime } from './weatherCodes'
import type { CityResult, WeatherData } from './types'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { WeatherTopbarSearch } from './WeatherTopbarSearch'
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
  const [searchIndex, setSearchIndex] = useState(-1)

  const [retryKey, setRetryKey] = useState(0)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const abortRef = useRef<AbortController | null>(null)
  const { setCustomSearch, clearConfig } = useTopbar()

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

    async function load() {
      try {
        const [result, historical] = await Promise.all([
          fetchWeather(coords.lat, coords.lon, ctrl.signal),
          fetchHistoricalWeather(coords.lat, coords.lon, ctrl.signal),
        ])
        if (!ctrl.signal.aborted) {
          setData({ ...result, historical })
          setLoading(false)
          setSearchQuery('')
        }
      } catch (err) {
        if (
          !ctrl.signal.aborted &&
          !(err instanceof DOMException && err.name === 'AbortError')
        ) {
          setError('Weather service temporarily unavailable. Open-Meteo API may be under maintenance.')
          setLoading(false)
        }
      }
    }

    load()
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
          setSearchIndex(-1)
          setSearching(false)
        }
      } catch (err) {
        console.warn('WeatherApp: search failed', err)
        if (!controller.signal.aborted) {
          setSearchResults([])
          setShowResults(false)
          setSearchIndex(-1)
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
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
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
    } catch (err) {
      console.warn('WeatherApp: geolocation failed', err)
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

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) {
      if (e.key === 'Escape') {
        setShowResults(false)
        setSearchQuery('')
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSearchIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (searchIndex >= 0 && searchIndex < searchResults.length) {
          selectCity(searchResults[searchIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowResults(false)
        setSearchIndex(-1)
        break
    }
  }, [showResults, searchResults, searchIndex, selectCity])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setShowResults(false)
    setSearchIndex(-1)
  }, [])

  const handleCloseResults = useCallback(() => {
    setShowResults(false)
  }, [])

  useEffect(() => {
    setCustomSearch(
      <WeatherTopbarSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        showResults={showResults}
        onCloseResults={handleCloseResults}
        searchIndex={searchIndex}
        onHoverResult={setSearchIndex}
        searching={searching}
        geoLoading={geoLoading}
        onKeyDown={handleSearchKeyDown}
        onSelectCity={selectCity}
        onGeoRequest={handleGeoRequest}
        onClear={handleClearSearch}
        onFocusSearch={() => searchResults.length > 0 && setShowResults(true)}
      />,
    )
    return () => { clearConfig() }
  }, [searchQuery, searchResults, showResults, searchIndex, searching, geoLoading, handleSearchKeyDown, selectCity, handleGeoRequest, handleClearSearch, handleCloseResults, setCustomSearch, clearConfig])

  const showRain = data && data.current.weather_code >= 61 && data.current.weather_code <= 82 && !prefersReducedMotion
  const showLightning = data && data.current.weather_code >= 95

  const showErrorPage = error && !data

  if (showErrorPage) {
    return (
      <div className="gf-weather">
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
                <span className="gf-weather__icon"><GfIcon name={weatherInfo.icon as IconName} size={48} /></span>
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
              <div className="gf-weather__detail-icon"><GfIcon name="droplet" size={18} /></div>
              <div className="gf-weather__detail-value">{data.current.relative_humidity_2m}%</div>
              <div className="gf-weather__detail-label">Humidity</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon"><GfIcon name="wind" size={18} /></div>
              <div className="gf-weather__detail-value">{Math.round(data.current.wind_speed_10m)} km/h</div>
              <div className="gf-weather__detail-label">Wind</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon"><GfIcon name="pressure" size={18} /></div>
              <div className="gf-weather__detail-value">{Math.round(data.current.pressure_msl)} hPa</div>
              <div className="gf-weather__detail-label">Pressure</div>
            </div>
            <div className="gf-weather__detail-card">
              <div className="gf-weather__detail-icon"><GfIcon name="sunrise" size={18} /></div>
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
                    <span className="gf-weather__day-icon"><GfIcon name={dayInfo.icon as IconName} size={16} /></span>
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
                        <span className="gf-weather__day-precip-icon"><GfIcon name="droplet" size={10} /></span>
                        {precip}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {data.historical && (
            <div className="gf-weather__history">
              <h3 className="gf-weather__history-title">Last 7 Days</h3>
              <div className="gf-weather__history-chart">
                {data.historical.daily.time.map((dateStr, i) => {
                  const maxT = Math.round(data.historical!.daily.temperature_2m_max[i])
                  const minT = Math.round(data.historical!.daily.temperature_2m_min[i])
                  const precip = data.historical!.daily.precipitation_sum[i] || 0
                  const allMax = Math.max(...data.historical!.daily.temperature_2m_max)
                  const allMin = Math.min(...data.historical!.daily.temperature_2m_min)
                  const range = allMax - allMin || 1
                  const barHeight = ((maxT - minT) / range) * 100
                  const barBottom = ((minT - allMin) / range) * 100
                  const midTemp = (minT + maxT) / 2
                  const coldWarm = Math.min(Math.max((midTemp - allMin) / (allMax - allMin || 1), 0), 1)
                  const r = Math.round(50 + coldWarm * 205)
                  const g = Math.round(130 - coldWarm * 80)
                  const b = Math.round(220 - coldWarm * 180)
                  const barColor = `rgb(${r}, ${g}, ${b})`

                  return (
                    <div key={dateStr} className="gf-weather__history-day">
                      <span className="gf-weather__history-label">
                        {new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <div className="gf-weather__history-bar-track">
                        <div
                          className="gf-weather__history-bar"
                          style={{
                            height: `${Math.max(barHeight, 8)}%`,
                            bottom: `${barBottom}%`,
                            background: barColor,
                          }}
                        >
                          <span className="gf-weather__history-bar-temp">{maxT}°</span>
                        </div>
                        {precip > 0 && (
                          <div
                            className="gf-weather__history-precip"
                            style={{ height: `${Math.min(precip, 100)}%` }}
                            title={`${precip}mm precipitation`}
                          />
                        )}
                      </div>
                      <span className="gf-weather__history-min">{minT}°</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.daily.sunrise[0] && data.daily.sunset[0] && (
            <div className="gf-weather__timeline">
              <h3 className="gf-weather__timeline-title">Sun & Moon</h3>
              <div className="gf-weather__timeline-bar">
                {(() => {
                  const now = new Date()
                  const sunrise = new Date(data.daily.sunrise[0])
                  const sunset = new Date(data.daily.sunset[0])
                  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                  const dayEnd = new Date(dayStart.getTime() + 86400000)
                  const total = dayEnd.getTime() - dayStart.getTime()
                  const sunrisePct = ((sunrise.getTime() - dayStart.getTime()) / total) * 100
                  const sunsetPct = ((sunset.getTime() - dayStart.getTime()) / total) * 100
                  const nowPct = ((now.getTime() - dayStart.getTime()) / total) * 100
                  const dayLength = Math.round((sunset.getTime() - sunrise.getTime()) / 60000)
                  const hours = Math.floor(dayLength / 60)
                  const mins = dayLength % 60

                  return (
                    <>
                      <div className="gf-weather__timeline-night" style={{ left: 0, width: `${sunrisePct}%` }} />
                      <div className="gf-weather__timeline-daylight" style={{ left: `${sunrisePct}%`, width: `${sunsetPct - sunrisePct}%` }} />
                      <div className="gf-weather__timeline-night" style={{ left: `${sunsetPct}%`, width: `${100 - sunsetPct}%` }} />
                      <div className="gf-weather__timeline-sunrise" style={{ left: `${sunrisePct}%` }} title={`Sunrise ${formatTime(data.daily.sunrise[0])}`} />
                      <div className="gf-weather__timeline-sunset" style={{ left: `${sunsetPct}%` }} title={`Sunset ${formatTime(data.daily.sunset[0])}`} />
                      {nowPct >= sunrisePct && nowPct <= sunsetPct && (
                        <div className="gf-weather__timeline-now" style={{ left: `${nowPct}%` }} />
                      )}
                      <div className="gf-weather__timeline-times">
                        <span>{formatTime(data.daily.sunrise[0])}</span>
                        <span className="gf-weather__timeline-daylength">{hours}h {mins}m</span>
                        <span>{formatTime(data.daily.sunset[0])}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
