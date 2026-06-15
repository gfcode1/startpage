import { Box, Text, Group, ScrollArea, Paper } from '@mantine/core'
import { useCalendarStore, getFilteredEvents } from '../store'
import { formatDate, getHours, DAYS, getCategoryColor } from '../utils'

interface WeekViewProps {
  onDateClick: (date: string) => void
  onEventClick: (eventId: string) => void
}

export function WeekView({ onDateClick, onEventClick }: WeekViewProps) {
  const events = useCalendarStore((s) => s.events)
  const categories = useCalendarStore((s) => s.categories)
  const year = useCalendarStore((s) => s.year)
  const month = useCalendarStore((s) => s.month)
  const searchQuery = useCalendarStore((s) => s.searchQuery)
  const categoryFilter = useCalendarStore((s) => s.categoryFilter)

  const todayStr = new Date().toISOString().slice(0, 10)
  const filtered = getFilteredEvents(events, searchQuery, categoryFilter)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const middle = new Date(year, month, 15)
    const dayOfWeek = middle.getDay()
    const d = new Date(middle)
    d.setDate(15 - dayOfWeek + i)
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate())
  })

  const hours = getHours()

  function getEventsAt(dow: number, hour: number) {
    const dateStr = weekDates[dow]
    return filtered.filter((e) => {
      if (e.date !== dateStr) return false
      if (e.allDay) return false
      const t = e.time
      if (!t) return false
      const eventHour = parseInt(t.split(':')[0]!, 10)
      return eventHour === hour
    })
  }

  function getAllDayEvents(dow: number) {
    const dateStr = weekDates[dow]
    return filtered.filter((e) => e.date === dateStr && e.allDay)
  }

  return (
    <ScrollArea h={600}>
      <Box>
        {/* Header row */}
        <Group gap={0} mb="xs" wrap="nowrap">
          <Box w={50} />
          {weekDates.map((dateStr, i) => {
            const today = dateStr === todayStr
            const day = parseInt(dateStr.split('-')[2] ?? '0', 10)
            return (
              <Box key={dateStr} style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xs" fw={600} c="dimmed">{DAYS[i]}</Text>
                <Text
                  size="sm"
                  fw={today ? 700 : 400}
                  style={{
                    width: 28,
                    height: 28,
                    lineHeight: '28px',
                    borderRadius: '50%',
                    margin: '0 auto',
                    background: today ? 'var(--mantine-color-accent-5)' : undefined,
                    color: today ? 'var(--mantine-color-white)' : undefined,
                  }}
                >
                  {day}
                </Text>
                {getAllDayEvents(i).map((e) => (
                  <Paper
                    key={e.id}
                    p={2}
                    radius="xs"
                    style={{
                      background: e.color || getCategoryColor(e.categoryId, categories),
                      cursor: 'pointer',
                      marginBottom: 1,
                    }}
                    onClick={() => onEventClick(e.id)}
                  >
                    <Text size="xs" truncate="end" c="white" style={{ fontSize: 10 }}>{e.title}</Text>
                  </Paper>
                ))}
              </Box>
            )
          })}
        </Group>

        {/* Time grid */}
        {hours.map((hour, hi) => (
          <Group key={hour} gap={0} wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Box w={50} style={{ position: 'relative' }}>
              <Text size="xs" c="dimmed" style={{ position: 'absolute', top: -8, right: 4 }}>
                {hour}
              </Text>
            </Box>
            {weekDates.map((dateStr, di) => {
              const cellEvents = getEventsAt(di, hi)
              return (
                <Box
                  key={`${dateStr}-${hour}`}
                  style={{
                    flex: 1,
                    minHeight: 40,
                    position: 'relative',
                    cursor: 'pointer',
                    background: dateStr === todayStr ? 'var(--mantine-color-accent-0)' : undefined,
                  }}
                  onClick={() => {
                    const hh = String(hi).padStart(2, '0')
                    onDateClick(`${dateStr}T${hh}:00`)
                  }}
                >
                  {cellEvents.map((e) => (
                    <Paper
                      key={e.id}
                      p={2}
                      radius="xs"
                      style={{
                        background: e.color || getCategoryColor(e.categoryId, categories),
                        cursor: 'pointer',
                        position: 'absolute',
                        left: 1,
                        right: 1,
                        top: 0,
                        zIndex: 1,
                      }}
                      onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); onEventClick(e.id) }}
                    >
                      <Text size="xs" c="white" truncate="end" style={{ fontSize: 10 }}>{e.title}</Text>
                    </Paper>
                  ))}
                </Box>
              )
            })}
          </Group>
        ))}
      </Box>
    </ScrollArea>
  )
}
