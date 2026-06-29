import { SimpleGrid, Text } from '@mantine/core'
import { DayCell } from './day-cell'
import { useCalendarStore, getEventsForDate, getFilteredEvents } from '../store'
import { getDaysInMonth, getFirstDayOfMonth, formatDate, DAYS } from '../utils'

interface CalendarGridProps {
  onDateClick: (date: string) => void
  onEventClick: (eventId: string) => void
}

export function CalendarGrid({ onDateClick, onEventClick }: CalendarGridProps) {
  const events = useCalendarStore((s) => s.events)
  const categories = useCalendarStore((s) => s.categories)
  const year = useCalendarStore((s) => s.year)
  const month = useCalendarStore((s) => s.month)
  const searchQuery = useCalendarStore((s) => s.searchQuery)
  const categoryFilter = useCalendarStore((s) => s.categoryFilter)
  const moveEvent = useCalendarStore((s) => s.moveEvent)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const filtered = getFilteredEvents(events, searchQuery, categoryFilter)

  function handleEventDrop(eventId: string, newDate: string) {
    moveEvent(eventId, newDate)
  }

  return (
    <>
      <SimpleGrid cols={7} spacing="xs" mb="xs">
        {DAYS.map((d) => (
          <Text key={d} size="xs" ta="center" fw={600} c="dimmed">{d}</Text>
        ))}
      </SimpleGrid>
      <SimpleGrid cols={7} spacing="xs">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: 'var(--mantine-color-body)' }} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = formatDate(year, month, day)
          const dayEvents = getEventsForDate(filtered, dateStr)

          return (
            <DayCell
              key={dateStr}
              day={day}
              dateStr={dateStr}
              events={dayEvents}
              categories={categories}
              onDateClick={() => onDateClick(dateStr)}
              onEventClick={(event) => onEventClick(event.id)}
              onEventDrop={handleEventDrop}
              searchQuery={searchQuery}
            />
          )
        })}
      </SimpleGrid>
    </>
  )
}
