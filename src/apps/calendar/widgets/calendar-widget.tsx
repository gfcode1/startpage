import { useState, useEffect } from 'react'
import { Text, Stack, Group } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { CalendarEvent } from '../types'
import { WidgetEmpty } from '@/ui/widget-container'
import { STORAGE_KEY } from '../store'
import { getStorage } from '@/lib/storage/engine'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'

const WIDGET_ID = 'calendar'

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    return getStorage().get<CalendarEvent[]>(STORAGE_KEY) ?? []
  })

  const daysToShow = useWidgetOptionsStore(
    (s) => (s.options[WIDGET_ID]?.daysToShow as number) ?? 7,
  )

  useEffect(() => {
    const unsub = getStorage().subscribe(STORAGE_KEY, () => {
      setEvents(getStorage().get<CalendarEvent[]>(STORAGE_KEY) ?? [])
    })
    return unsub
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEvents = events.filter((e) => e.date === today)

  const rangeEnd = new Date()
  rangeEnd.setDate(rangeEnd.getDate() + daysToShow)
  const rangeEndStr = rangeEnd.toISOString().slice(0, 10)
  const upcoming = events
    .filter((e) => e.date >= today && e.date <= rangeEndStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    .slice(0, 8)

  const display = todayEvents.length > 0 ? todayEvents.slice(0, 5) : upcoming

  if (display.length === 0) {
    return (
      <Link to="/calendar" style={{ textDecoration: 'none' }}>
        <WidgetEmpty>No events today</WidgetEmpty>
      </Link>
    )
  }

  return (
    <Stack gap="xs">
      {todayEvents.length > 0 && (
        <Text size="xs" c="dimmed">Today</Text>
      )}
      {display.map((e) => (
        <Link key={e.id} to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Group gap="xs" wrap="nowrap">
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
        </Link>
      ))}
      {upcoming.length > 5 && (
        <Text size="xs" c="dimmed" component={Link} to="/calendar">
          +{upcoming.length - 5} more
        </Text>
      )}
    </Stack>
  )
}
