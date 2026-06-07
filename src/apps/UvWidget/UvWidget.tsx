import { useState, useEffect } from 'react'
import './UvWidget.css'

const API = 'https://api.open-meteo.com/v1/forecast'

function uvLabel(index: number): { label: string; className: string } {
  if (index <= 2) return { label: 'Low', className: 'gf-widget-uv--low' }
  if (index <= 5) return { label: 'Moderate', className: 'gf-widget-uv--moderate' }
  if (index <= 7) return { label: 'High', className: 'gf-widget-uv--high' }
  if (index <= 10) return { label: 'Very High', className: 'gf-widget-uv--very-high' }
  return { label: 'Extreme', className: 'gf-widget-uv--extreme' }
}

export default function UvWidget() {
  const [uv, setUv] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchUv = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        const params = new URLSearchParams({ latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString(), daily: 'uv_index_max', forecast_days: '1' })
        const res = await fetch(`${API}?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) { setUv(json.daily?.uv_index_max?.[0] ?? null); setError(false) }
      } catch { if (!cancelled) setError(true) }
    }
    fetchUv()
    const id = setInterval(fetchUv, 60 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (error && uv === null) return <div className="gf-widget-uv"><span className="gf-widget-uv__empty">UV unavailable</span></div>
  if (uv === null) return <div className="gf-widget-uv gf-widget-uv--loading">—</div>

  const info = uvLabel(uv)
  return (
    <div className="gf-widget-uv">
      <span className="gf-widget-uv__label">UV Index</span>
      <span className={`gf-widget-uv__value ${info.className}`}>{Math.round(uv * 10) / 10}</span>
      <span className={`gf-widget-uv__level ${info.className}`}>{info.label}</span>
    </div>
  )
}
