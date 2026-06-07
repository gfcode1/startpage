import { useState, useEffect } from 'react'
import { GfIcon, getMoonPhaseIcon } from '../../framework/iconSystem'
import './MoonWidget.css'

interface MoonInfo { phase: string; phaseIndex: number; illumination: number }

const PHASE_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']

function getMoonInfo(date: Date): MoonInfo {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14)
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  const frac = (daysSince / 29.53058867) - Math.floor(daysSince / 29.53058867)
  const illumination = frac < 0.5 ? frac * 2 : (1 - frac) * 2
  const starts = [0.97, 0.03, 0.22, 0.28, 0.47, 0.53, 0.72, 0.78]
  let phaseIndex = 0
  for (let i = 0; i < starts.length; i++) {
    if (frac >= starts[i]) phaseIndex = i
  }
  return { phaseIndex, phase: PHASE_NAMES[phaseIndex], illumination: Math.round(illumination * 100) }
}

export default function MoonWidget() {
  const [info, setInfo] = useState<MoonInfo>(() => getMoonInfo(new Date()))
  useEffect(() => { const t = setInterval(() => setInfo(getMoonInfo(new Date())), 60*60*1000); return () => clearInterval(t) }, [])
  return (
    <div className="gf-widget-moon">
      <span className="gf-widget-moon__emoji"><GfIcon name={getMoonPhaseIcon(info.phaseIndex)} size={24} /></span>
      <span className="gf-widget-moon__phase">{info.phase}</span>
      <span className="gf-widget-moon__illum">{info.illumination}%</span>
    </div>
  )
}
