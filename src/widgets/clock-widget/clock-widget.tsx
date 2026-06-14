import { useState, useEffect } from 'react'
import { Text, Stack } from '@mantine/core'

export default function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Stack align="center" gap={0}>
      <Text
        style={{ fontFamily: 'var(--mantine-heading-font-family)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
        fw={700}
      >
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text size="xs" c="dimmed">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>
    </Stack>
  )
}
