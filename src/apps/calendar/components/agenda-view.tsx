import { Stack, Group, Text, Paper } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCalendarStore, getFilteredEvents, getEventsForDate } from '../store'
import { getDaysInMonth, formatDate, getCategoryColor } from '../utils'
import { MONTHS } from '../utils'

interface AgendaViewProps {
  onEventClick: (eventId: string) => void
}

export function AgendaView({ onEventClick }: AgendaViewProps) {
  const events = useCalendarStore((s) => s.events)
  const categories = useCalendarStore((s) => s.categories)
  const year = useCalendarStore((s) => s.year)
  const month = useCalendarStore((s) => s.month)
  const searchQuery = useCalendarStore((s) => s.searchQuery)
  const categoryFilter = useCalendarStore((s) => s.categoryFilter)

  const daysInMonth = getDaysInMonth(year, month)
  const filtered = getFilteredEvents(events, searchQuery, categoryFilter)
  const todayStr = new Date().toISOString().slice(0, 10)

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = formatDate(year, month, i + 1)
    return { dateStr, day: i + 1, events: getEventsForDate(filtered, dateStr) }
  }).filter((d) => d.events.length > 0)

  if (days.length === 0) {
    return (
      <Paper p="xl" ta="center">
        <Icon icon="lucide:calendar" width={40} style={{ opacity: 0.3 }} />
        <Text c="dimmed" mt="sm">No events this month</Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      {days.map(({ dateStr, day, events: dayEvents }) => {
        const isToday = dateStr === todayStr
        return (
          <Paper key={dateStr} withBorder p="sm" radius="sm" style={{
            borderColor: isToday ? 'var(--mantine-color-accent-5)' : undefined,
            background: isToday ? 'var(--mantine-color-accent-0)' : undefined,
          }}>
            <Group gap="xs" mb="xs">
              <Text fw={600} size="sm">{day}</Text>
              <Text size="sm" c="dimmed">{MONTHS[month]}</Text>
              {isToday && <Text size="xs" c="accent" fw={600}>Today</Text>}
            </Group>
            <Stack gap={4}>
              {dayEvents.map((e) => {
                const color = e.color || getCategoryColor(e.categoryId, categories)
                return (
                  <Group
                    key={e.id}
                    gap="sm"
                    wrap="nowrap"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onEventClick(e.id)}
                  >
                    <div style={{ width: 4, height: 32, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>{e.title}</Text>
                      <Group gap="xs">
                        {e.time && <Text size="xs" c="dimmed">{e.time}</Text>}
                        {e.duration && <Text size="xs" c="dimmed">· {e.duration}min</Text>}
                      </Group>
                    </div>
                    {e.notes && <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 200 }}>{e.notes}</Text>}
                  </Group>
                )
              })}
            </Stack>
          </Paper>
        )
      })}
    </Stack>
  )
}
