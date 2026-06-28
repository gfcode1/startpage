import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Container, Text, Group, Button, Progress, Paper,
  ActionIcon, Center, SegmentedControl,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { getStorage } from '@/lib/storage/engine'
import { formatTime } from '@/lib/utils/format'

const POMODORO = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

type Mode = 'pomodoro' | 'short_break' | 'long_break'
type Status = 'idle' | 'running' | 'paused'

const STORAGE_KEY = 'pomodoro:stats'

interface Stats {
  completed: number
  totalMinutes: number
}

function loadStats(): Stats {
  return getStorage().get<Stats>(STORAGE_KEY) ?? { completed: 0, totalMinutes: 0 }
}

function saveStats(stats: Stats): void {
  getStorage().set(STORAGE_KEY, stats)
}

const MODES: { value: Mode; label: string }[] = [
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'short_break', label: 'Short Break' },
  { value: 'long_break', label: 'Long Break' },
]

const MODE_DURATIONS: Record<Mode, number> = {
  pomodoro: POMODORO,
  short_break: SHORT_BREAK,
  long_break: LONG_BREAK,
}

function notifyCompletion(mode: Mode) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pomodoro Timer', {
      body: mode === 'pomodoro' ? 'Focus session complete! Take a break.' : 'Break is over! Time to focus.',
    })
  }
}

const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null

async function playBeep() {
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.value = 800
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.3)
}

export default function PomodoroApp() {
  const [mode, setMode] = useState<Mode>('pomodoro')
  const [status, setStatus] = useState<Status>('idle')
  const [timeLeft, setTimeLeft] = useState(POMODORO)
  const [stats, setStats] = useState(loadStats)
  const statsRef = useRef(stats)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => { statsRef.current = stats }, [stats])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleTimerComplete = useCallback(() => {
    clearTimer()
    setStatus('idle')
    if (mode === 'pomodoro') {
      const currentStats = statsRef.current
      const newStats = {
        completed: currentStats.completed + 1,
        totalMinutes: currentStats.totalMinutes + Math.round(POMODORO / 60),
      }
      setStats(newStats)
      saveStats(newStats)
    }
    notifyCompletion(mode)
    playBeep()
    setTimeLeft(MODE_DURATIONS[mode])
  }, [mode, clearTimer])

  const startTimer = useCallback(() => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete()
          return MODE_DURATIONS[mode]
        }
        return prev - 1
      })
    }, 1000)
  }, [mode, clearTimer, handleTimerComplete])

  const toggleTimer = useCallback(() => {
    if (status === 'idle') {
      setTimeLeft(MODE_DURATIONS[mode])
      setStatus('running')
      startTimer()
    } else if (status === 'running') {
      clearTimer()
      setStatus('paused')
    } else {
      setStatus('running')
      startTimer()
    }
  }, [status, mode, startTimer, clearTimer])

  const resetTimer = useCallback(() => {
    clearTimer()
    setStatus('idle')
    setTimeLeft(MODE_DURATIONS[mode])
  }, [mode, clearTimer])

  const changeMode = useCallback((newMode: Mode) => {
    if (status === 'running' && !window.confirm('Switch mode? Current session progress will be lost.')) return
    clearTimer()
    setMode(newMode)
    setStatus('idle')
    setTimeLeft(MODE_DURATIONS[newMode])
  }, [status, clearTimer])

  const handleModeChange = (val: string) => {
    const m = MODES.find((x) => x.value === val)
    if (m) changeMode(m.value)
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useHotkeys([
    ['alt + N', toggleTimer],
  ])

  const progress = 1 - timeLeft / MODE_DURATIONS[mode]
  const totalMinutes = stats.totalMinutes

  return (
    <Container size="xs" py="md">
      <Text fw={700} size="lg" ta="center" mb="md" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
        Pomodoro
      </Text>

      <Center mb="lg">
        <SegmentedControl value={mode} onChange={handleModeChange} data={MODES} size="xs" />
      </Center>

      <Paper withBorder p="xl" radius="md" mb="md">
        <Progress value={progress * 100} size="sm" mb="lg" />

        <Text
          ta="center"
          fw={700}
          style={{ fontFamily: 'var(--mantine-heading-font-family)', fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}
          mb="lg"
        >
          {formatTime(timeLeft)}
        </Text>

        <Group justify="center" gap="md">
          <Button
            size="lg"
            radius="xl"
            onClick={toggleTimer}
            leftSection={<Icon icon={status === 'running' ? 'lucide:pause' : 'lucide:play'} width={20} />}
          >
            {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
          </Button>
          <ActionIcon variant="subtle" size="lg" onClick={resetTimer} aria-label="Reset">
            <Icon icon="lucide:rotate-ccw" width={20} />
          </ActionIcon>
        </Group>
      </Paper>

      <Group justify="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Text fw={700} size="xl">{stats.completed}</Text>
          <Text size="xs" c="dimmed">Pomodoros</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text fw={700} size="xl">{totalMinutes}</Text>
          <Text size="xs" c="dimmed">Minutes</Text>
        </div>
      </Group>
    </Container>
  )
}
