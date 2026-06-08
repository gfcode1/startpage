import { useState, useRef, useCallback, useEffect } from 'react'

interface SleepTimerProps {
  onSleep: () => void
}

export function SleepTimer({ onSleep }: SleepTimerProps) {
  const [minutes, setMinutes] = useState(15)
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRemaining(0)
  }, [])

  const start = useCallback(() => {
    stop()
    const ms = minutes * 60 * 1000
    const end = Date.now() + ms
    setRemaining(ms)

    intervalRef.current = setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) {
        stop()
        onSleep()
      } else {
        setRemaining(left)
      }
    }, 1000)
  }, [minutes, stop, onSleep])

  useEffect(() => {
    return stop
  }, [stop])

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isActive = remaining > 0

  return (
    <div className="gf-moodist__panel">
      <div className="gf-moodist__panel-title">Sleep Timer</div>
      <div className="gf-moodist__timer">
        <select
          className="gf-moodist__select"
          value={minutes}
          onChange={e => setMinutes(Number(e.target.value))}
          disabled={isActive}
        >
          <option value={5}>5 min</option>
          <option value={10}>10 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
          <option value={90}>90 min</option>
          <option value={120}>120 min</option>
        </select>

        {isActive ? (
          <>
            <span className="gf-moodist__timer-remaining">
              {formatTime(remaining)}
            </span>
            <button className="gf-moodist__btn gf-moodist__btn--secondary" onClick={stop}>
              Cancel
            </button>
          </>
        ) : (
          <button className="gf-moodist__btn gf-moodist__btn--secondary" onClick={start}>
            Start
          </button>
        )}
      </div>
    </div>
  )
}
