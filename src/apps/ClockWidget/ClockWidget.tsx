import { useState, useEffect } from 'react'
import './ClockWidget.css'

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ClockWidget() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="gf-widget-clock">
      <span className="gf-widget-clock__time">{formatTime(now)}</span>
      <span className="gf-widget-clock__date">{formatDate(now)}</span>
    </div>
  )
}
