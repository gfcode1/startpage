import { useState, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useWidgetOptions } from '../../framework/WidgetOptionsContext'
import './CountdownWidget.css'

function calcDiff(target: Date): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const now = Date.now()
  const t = target.getTime()
  if (t <= now) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const diff = t - now
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  }
}

export default function CountdownWidget() {
  const { options: opts } = useWidgetOptions('countdown')
  const targetLabel = (opts?.label as string) || ''
  const targetDateStr = (opts?.date as string) || ''

  const [, update] = useState(0)

  useEffect(() => {
    const t = setInterval(() => update(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!targetDateStr) {
    return (
      <div className="gf-widget-countdown">
        <GfWidgetAction label="Set a date in widget options" onClick={() => {}} />
      </div>
    )
  }

  const target = new Date(targetDateStr)
  const diff = calcDiff(target)

  return (
    <div className="gf-widget-countdown">
      <div className="gf-widget-countdown__header">
        <GfIcon name="timer" size={14} />
        <span className="gf-widget-countdown__label">{targetLabel || 'Countdown'}</span>
      </div>
      {diff.expired ? (
        <span className="gf-widget-countdown__expired">Time&rsquo;s up!</span>
      ) : (
        <div className="gf-widget-countdown__display">
          <div className="gf-widget-countdown__unit">
            <span className="gf-widget-countdown__num">{diff.days}</span>
            <span className="gf-widget-countdown__unit-label">days</span>
          </div>
          <span className="gf-widget-countdown__col">:</span>
          <div className="gf-widget-countdown__unit">
            <span className="gf-widget-countdown__num">{diff.hours}</span>
            <span className="gf-widget-countdown__unit-label">hrs</span>
          </div>
          <span className="gf-widget-countdown__col">:</span>
          <div className="gf-widget-countdown__unit">
            <span className="gf-widget-countdown__num">{diff.minutes}</span>
            <span className="gf-widget-countdown__unit-label">min</span>
          </div>
          <span className="gf-widget-countdown__col">:</span>
          <div className="gf-widget-countdown__unit">
            <span className="gf-widget-countdown__num">{diff.seconds}</span>
            <span className="gf-widget-countdown__unit-label">sec</span>
          </div>
        </div>
      )}
    </div>
  )
}
