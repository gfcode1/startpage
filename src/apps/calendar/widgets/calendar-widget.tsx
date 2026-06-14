import { useState, useEffect } from 'react'
import { Text, Stack, Group } from '@mantine/core'
import type { CalendarEvent } from '../types'
import { WidgetEmpty } from '@/ui/widget-container'
import { loadEvents } from '../utils'
import { getStorage } from '@/lib/storage/engine'

const STORAGE_KEY = 'calendar:events'

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)

  useEffect(() => {
    const unsub = getStorage().subscribe(STORAGE_KEY, () => {
      setEvents(loadEvents())
    })
    return unsub
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEvents = events.filter((e) => e.date === today).slice(0, 5)
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const display = todayEvents.length > 0 ? todayEvents : upcoming

  if (display.length === 0) {
    return <WidgetEmpty>No events today</WidgetEmpty>
  }

  return (
    <Stack gap="xs">
      {todayEvents.length > 0 && (
        <Text size="xs" c="dimmed">Today</Text>
      )}
      {display.map((e) => (
        <Group key={e.id} gap="xs" wrap="nowrap">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: e.color ?? 'var(--mantine-color-accent-5)',
              flexShrink: 0,
            }}
          />
          <Text size="sm" truncate="end" style={{ flex: 1 }}>
            {e.title}
          </Text>
          {e.time && <Text size="xs" c="dimmed">{e.time}</Text>}
        </Group>
      ))}
    </Stack>
  )
}
