import { useState, useEffect, useRef, useCallback } from 'react'
import { Text, Stack, Group, TextInput, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { getStorage } from '@/lib/storage/engine'
import { formatTime } from '@/lib/utils/format'

const STORAGE_KEY = 'widgets:countdown'

interface CountdownData {
  total: number
  remaining: number
  label: string
  active: boolean
  updatedAt: number
}

function load(): CountdownData {
  return getStorage().get<CountdownData>(STORAGE_KEY) ?? { total: 0, remaining: 0, label: '', active: false, updatedAt: 0 }
}

function save(data: CountdownData) {
  getStorage().set(STORAGE_KEY, data)
}

export default function CountdownWidget() {
  const [data, setData] = useState<CountdownData>(load)
  const [minutes, setMinutes] = useState('25')
  const [label, setLabel] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const persist = useCallback(() => {
    save(dataRef.current)
  }, [])

  useEffect(() => {
    if (!data.active) return
    intervalRef.current = setInterval(() => {
      setData((prev) => {
        const remaining = Math.max(0, prev.remaining - 1)
        if (remaining <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        return { ...prev, remaining }
      })
    }, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [data.active])

  useEffect(() => {
    if (!data.active && data.updatedAt > 0) {
      save(data)
    }
    // only trigger on active -> inactive transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.active])

  useEffect(() => {
    if (!data.active) return
    const id = setInterval(persist, 2000)
    return () => clearInterval(id)
  }, [data.active, persist])

  useEffect(() => {
    if (!data.active || data.remaining <= 0) return
    intervalRef.current = setInterval(() => {
      setData((prev) => {
        const remaining = Math.max(0, prev.remaining - 1)
        return { ...prev, remaining }
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [data.active, data.remaining])

  const startCountdown = () => {
    const total = parseInt(minutes) * 60
    if (isNaN(total) || total <= 0) return
    setData({ total, remaining: total, label, active: true, updatedAt: Date.now() })
  }

  const resetCountdown = () => {
    setData({ total: 0, remaining: 0, label: '', active: false, updatedAt: 0 })
  }

  if (data.active) {
    const progress = data.total > 0 ? 1 - data.remaining / data.total : 0
    const pct = Math.round(progress * 100)

    return (
      <Stack align="center" gap="xs">
        {data.label && <Text size="xs" c="dimmed">{data.label}</Text>}
        <div
          style={{
            width: '100%',
            height: 4,
            background: 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-6))',
            borderRadius: 'var(--mantine-radius-sm)',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--mantine-color-accent-5)', transition: 'width 1s linear' }} />
        </div>
        <Text fw={700} style={{ fontFamily: 'var(--mantine-heading-font-family)', fontSize: '1.3rem' }}>
          {formatTime(data.remaining)}
        </Text>
        <Button size="compact-xs" variant="light" color="red" onClick={resetCountdown}>Reset</Button>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap">
        <TextInput
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.currentTarget.value)}
          size="xs"
          style={{ width: 70 }}
          type="number"
        />
        <TextInput
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          size="xs"
          style={{ flex: 1 }}
        />
      </Group>
      <Button
        size="compact-xs"
        variant="light"
        onClick={startCountdown}
        leftSection={<Icon icon="lucide:play" width={12} />}
      >
        Start
      </Button>
    </Stack>
  )
}
