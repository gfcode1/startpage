import { useState, useEffect } from 'react'
import { usePlayerState } from '../../../framework/PlayerContext'
import { GfIcon } from '../../../framework/iconSystem'

function formatRemaining(ms: number): string {
  if (ms <= 0) return ''
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SleepTimerWidget() {
  const { sleepTimer, playingId } = usePlayerState()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remaining = sleepTimer !== null ? Math.max(0, sleepTimer - now) : 0
  const active = remaining > 0 && playingId !== null

  return (
    <div className="gf-widget-sleeptimer">
      <div className="gf-widget-sleeptimer__header">
        <GfIcon name="moon" size={14} />
        <span className="gf-widget-sleeptimer__label">Sleep Timer</span>
      </div>
      {active ? (
        <div className="gf-widget-sleeptimer__active">
          <span className="gf-widget-sleeptimer__time">{formatRemaining(remaining)}</span>
        </div>
      ) : (
        <span className="gf-widget-sleeptimer__idle">No timer active</span>
      )}
    </div>
  )
}
