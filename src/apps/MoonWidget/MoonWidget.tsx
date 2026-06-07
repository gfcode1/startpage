import { useState, useEffect } from 'react'
import './MoonWidget.css'

interface MoonInfo { phase: string; emoji: string; illumination: number }

function getMoonInfo(date: Date): MoonInfo {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14)
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  const frac = (daysSince / 29.53058867) - Math.floor(daysSince / 29.53058867)
  const illumination = frac < 0.5 ? frac * 2 : (1 - frac) * 2
  const phases = [
    { emoji: '🌑', phase: 'New Moon', start: 0.97 }, { emoji: '🌒', phase: 'Waxing Crescent', start: 0.03 },
    { emoji: '🌓', phase: 'First Quarter', start: 0.22 }, { emoji: '🌔', phase: 'Waxing Gibbous', start: 0.28 },
    { emoji: '🌕', phase: 'Full Moon', start: 0.47 }, { emoji: '🌖', phase: 'Waning Gibbous', start: 0.53 },
    { emoji: '🌗', phase: 'Last Quarter', start: 0.72 }, { emoji: '🌘', phase: 'Waning Crescent', start: 0.78 },
  ]
  let best = phases[0]!
  for (const p of phases) { if (frac >= p.start) best = p }
  return { emoji: best.emoji, phase: best.phase, illumination: Math.round(illumination * 100) }
}

export default function MoonWidget() {
  const [info, setInfo] = useState<MoonInfo>(() => getMoonInfo(new Date()))
  useEffect(() => { const t = setInterval(() => setInfo(getMoonInfo(new Date())), 60*60*1000); return () => clearInterval(t) }, [])
  return (
    <div className="gf-widget-moon">
      <span className="gf-widget-moon__emoji">{info.emoji}</span>
      <span className="gf-widget-moon__phase">{info.phase}</span>
      <span className="gf-widget-moon__illum">{info.illumination}%</span>
    </div>
  )
}
