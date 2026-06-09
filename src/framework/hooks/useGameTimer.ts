import { useState, useEffect, useCallback, useRef } from 'react'

export function useGameTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      return
    }
    intervalRef.current = setInterval(() => setElapsed(t => t + 1), 1000)
    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [running])

  const reset = useCallback(() => {
    setElapsed(0)
  }, [])

  const formatTime = useCallback((s?: number) => {
    const total = s ?? elapsed
    const m = Math.floor(total / 60)
    const sec = total % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }, [elapsed])

  return { elapsed, reset, formatTime }
}
