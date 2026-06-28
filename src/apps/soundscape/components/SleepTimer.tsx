import { useState, useRef, useCallback, useEffect } from 'react'
import { Text, Select, Button, Group, Stack } from '@mantine/core'

interface SleepTimerProps {
  onSleep: () => void
}

const FADE_DURATION = 30_000

export function SleepTimer({ onSleep }: SleepTimerProps) {
  const [minutes, setMinutes] = useState<string>('15')
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeRef = useRef(false)

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setRemaining(0)
    fadeRef.current = false
  }, [])

  const start = useCallback(() => {
    stop()
    const ms = Number(minutes) * 60 * 1000
    const end = Date.now() + ms
    setRemaining(ms)
    fadeRef.current = false
    intervalRef.current = setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) { stop(); onSleep() }
      else {
        setRemaining(left)
        if (left <= FADE_DURATION && !fadeRef.current) {
          fadeRef.current = true
        }
      }
    }, 200)
  }, [minutes, stop, onSleep])

  useEffect(() => { return stop }, [stop])

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isActive = remaining > 0
  const isFading = remaining > 0 && remaining <= FADE_DURATION

  return (
    <Stack gap="sm">
      <Text fw={600}>Sleep Timer</Text>
      <Group gap="sm">
        <Select
          value={minutes}
          onChange={(v) => v && setMinutes(v)}
          data={['5', '10', '15', '30', '45', '60', '90', '120'].map((v) => ({ value: v, label: `${v} min` }))}
          disabled={isActive}
          size="sm"
          style={{ width: 120 }}
        />
        {isActive ? (
          <>
            <Text fw={700} style={{ fontFamily: 'var(--app-font-mono)', color: isFading ? 'var(--mantine-color-accent-5)' : undefined }}>
              {formatTime(remaining)}
              {isFading && <Text component="span" size="xs" ml={4}>fade</Text>}
            </Text>
            <Button size="compact-sm" variant="light" color="red" onClick={stop}>Cancel</Button>
          </>
        ) : (
          <Button size="compact-sm" onClick={start}>Start</Button>
        )}
      </Group>
    </Stack>
  )
}
