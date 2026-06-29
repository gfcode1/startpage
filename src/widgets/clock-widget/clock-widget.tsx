import { useState, useEffect } from 'react'
import { Text, Stack } from '@mantine/core'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'

export default function ClockWidget() {
  const [time, setTime] = useState(new Date())
  const format = useWidgetOptionsStore((s) => (s.options.clock?.format as string) ?? '12h')

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeString = format === '24h'
    ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <Stack align="center" gap={0}>
      <Text
        style={{ fontFamily: 'var(--mantine-heading-font-family)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
        fw={700}
      >
        {timeString}
      </Text>
      <Text size="xs" c="dimmed">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>
    </Stack>
  )
}
