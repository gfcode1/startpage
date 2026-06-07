import { useState, useEffect } from 'react'
import './AqiWidget.css'

const API = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function aqiLabel(aqi: number): { label: string; className: string } {
  if (aqi <= 20) return { label: 'Good', className: 'gf-widget-aqi--good' }
  if (aqi <= 40) return { label: 'Fair', className: 'gf-widget-aqi--fair' }
  if (aqi <= 60) return { label: 'Moderate', className: 'gf-widget-aqi--moderate' }
  if (aqi <= 80) return { label: 'Poor', className: 'gf-widget-aqi--poor' }
  return { label: 'Very Poor', className: 'gf-widget-aqi--very-poor' }
}

export default function AqiWidget() {
  const [aqi, setAqi] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchAqi = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        const params = new URLSearchParams({ latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString(), current: 'european_aqi' })
        const res = await fetch(`${API}?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) { setAqi(json.current?.european_aqi ?? null); setError(false) }
      } catch { if (!cancelled) setError(true) }
    }
    fetchAqi()
    const id = setInterval(fetchAqi, 60 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (error && aqi === null) return <div className="gf-widget-aqi"><span className="gf-widget-aqi__empty">AQI unavailable</span></div>
  if (aqi === null) return <div className="gf-widget-aqi gf-widget-aqi--loading">—</div>

  const info = aqiLabel(aqi)
  return (
    <div className="gf-widget-aqi">
      <span className="gf-widget-aqi__label">Air Quality</span>
      <span className={`gf-widget-aqi__value ${info.className}`}>{aqi}</span>
      <span className={`gf-widget-aqi__level ${info.className}`}>{info.label}</span>
    </div>
  )
}
