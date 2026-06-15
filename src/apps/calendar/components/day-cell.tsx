import { Paper, Text, Stack, Group } from '@mantine/core'
import type { CalendarEvent } from '../types'
import { isToday, getCategoryColor } from '../utils'

interface DayCellProps {
  day: number
  dateStr: string
  events: CalendarEvent[]
  categories: { id: string; color: string }[]
  onDateClick: () => void
  onEventClick: (event: CalendarEvent) => void
  onEventDrop?: (eventId: string, newDate: string) => void
  searchQuery?: string
}

export function DayCell({ day, dateStr, events, categories, onDateClick, onEventClick, onEventDrop }: DayCellProps) {
  const today = isToday(dateStr)

  function handleDragStart(e: React.DragEvent, eventId: string) {
    e.dataTransfer.setData('text/plain', eventId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const eventId = e.dataTransfer.getData('text/plain')
    if (eventId && onEventDrop) {
      onEventDrop(eventId, dateStr)
    }
  }

  return (
    <Paper
      withBorder
      p="xs"
      radius="sm"
      style={{
        minHeight: 70,
        cursor: 'pointer',
        borderColor: today ? 'var(--mantine-color-accent-5)' : undefined,
        background: today ? 'var(--mantine-color-accent-5)' : undefined,
        transition: 'box-shadow 0.15s',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onDateClick}
    >
      <Text size="xs" fw={today ? 700 : 400} style={{ color: today ? 'var(--mantine-color-white)' : undefined }}>
        {day}
      </Text>
      <Stack gap={2} mt={2}>
        {events.slice(0, 3).map((e) => {
          const color = e.color || getCategoryColor(e.categoryId, categories)
          return (
            <Group
              key={e.id}
              gap={4}
              wrap="nowrap"
              draggable
              onDragStart={(ev: React.DragEvent) => handleDragStart(ev, e.id)}
              onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); onEventClick(e) }}
              style={{ cursor: 'grab', borderRadius: 2 }}
            >
              {color && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
              )}
              <Text size="xs" truncate="end" style={{ flex: 1, lineHeight: 1.3 }}>
                {e.time && <Text component="span" size="xs" c="dimmed">{e.time} </Text>}
                {e.title}
              </Text>
            </Group>
          )
        })}
        {events.length > 3 && (
          <Text size="xs" c="dimmed">+{events.length - 3} more</Text>
        )}
      </Stack>
    </Paper>
  )
}
