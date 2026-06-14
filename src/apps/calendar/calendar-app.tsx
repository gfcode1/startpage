import { useState, useEffect, useCallback } from 'react'
import {
  Container, Text, Group, Paper, ActionIcon, SimpleGrid, Modal,
  TextInput, Textarea, Button, Switch, ColorInput,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import type { CalendarEvent } from './types'
import { generateId } from '@/lib/utils/id'
import { loadEvents, saveEvents, getDaysInMonth, getFirstDayOfMonth, MONTHS, DAYS } from './utils'

export default function CalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDuration, setFormDuration] = useState(60)
  const [formNotes, setFormNotes] = useState('')
  const [formColor, setFormColor] = useState('#d4763a')
  const [formAllDay, setFormAllDay] = useState(true)
  const [saving, setSaving] = useState(false)

  // Save on change
  useEffect(() => { saveEvents(events) }, [events])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date().toISOString().slice(0, 10)

  function getEventsForDate(date: string): CalendarEvent[] {
    return events.filter((e) => e.date === date)
  }

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }, [month])

  const openNewEvent = useCallback((date: string) => {
    setSelectedDate(date)
    setEditingEvent(null)
    setFormTitle('')
    setFormTime('')
    setFormDuration(60)
    setFormNotes('')
    setFormColor('#d4763a')
    setFormAllDay(true)
    setModalOpen(true)
  }, [])

  const openEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedDate(event.date)
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormTime(event.time ?? '')
    setFormDuration(event.duration ?? 60)
    setFormNotes(event.notes ?? '')
    setFormColor(event.color ?? '#d4763a')
    setFormAllDay(!event.time)
    setModalOpen(true)
  }, [])

  const saveEvent = useCallback(() => {
    if (!formTitle.trim() || !selectedDate || saving) return
    setSaving(true)
    const base: CalendarEvent = {
      id: editingEvent?.id ?? generateId(),
      title: formTitle.trim(),
      date: selectedDate,
      time: formAllDay ? undefined : formTime,
      duration: formAllDay ? undefined : formDuration,
      notes: formNotes.trim() || undefined,
      color: formColor,
    }
    if (editingEvent) {
      setEvents((prev) => prev.map((e) => e.id === editingEvent.id ? base : e))
    } else {
      setEvents((prev) => [...prev, base])
    }
    setModalOpen(false)
    setSaving(false)
  }, [formTitle, formTime, formDuration, formNotes, formColor, formAllDay, selectedDate, editingEvent, saving])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setModalOpen(false)
  }, [])

  useHotkeys([
    ['alt + N', () => openNewEvent(today)],
  ])

  return (
    <Container size="lg" py="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            {MONTHS[month]} {year}
          </Text>
          <ActionIcon variant="subtle" onClick={prevMonth} aria-label="Previous month">
            <Icon icon="lucide:chevron-left" width={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={nextMonth} aria-label="Next month">
            <Icon icon="lucide:chevron-right" width={18} />
          </ActionIcon>
        </Group>
        <Button
          variant="light"
          size="compact-sm"
          leftSection={<Icon icon="lucide:plus" width={14} />}
          onClick={() => openNewEvent(today)}
        >
          Event
        </Button>
      </Group>

      {/* Day headers */}
      <SimpleGrid cols={7} spacing="xs" mb="xs">
        {DAYS.map((d) => (
          <Text key={d} size="xs" ta="center" fw={600} c="dimmed">{d}</Text>
        ))}
      </SimpleGrid>

      {/* Month grid */}
      <SimpleGrid cols={7} spacing="xs">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = getEventsForDate(dateStr)
          const isToday = dateStr === today

          return (
            <Paper
              key={dateStr}
              withBorder
              p="xs"
              radius="sm"
              style={{
                minHeight: 60,
                cursor: 'pointer',
                borderColor: isToday ? 'var(--mantine-color-accent-5)' : undefined,
                background: isToday ? 'var(--mantine-color-accent-5)' : undefined,
              }}
              onClick={() => openNewEvent(dateStr)}
            >
              <Text size="xs" fw={isToday ? 700 : 400} style={{ color: isToday ? 'var(--mantine-color-white)' : undefined }}>
                {day}
              </Text>
              {dayEvents.slice(0, 2).map((e) => (
                <Text
                  key={e.id}
                  size="xs"
                  truncate="end"
                  style={{ color: e.color, cursor: 'pointer' }}
                  onClick={(ev) => { ev.stopPropagation(); openEditEvent(e) }}
                >
                  {e.time ?? ''} {e.title}
                </Text>
              ))}
              {dayEvents.length > 2 && (
                <Text size="xs" c="dimmed">+{dayEvents.length - 2}</Text>
              )}
            </Paper>
          )
        })}
      </SimpleGrid>

      {/* Event Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'New Event'}
        size="sm"
      >
        <TextInput
          label="Title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.currentTarget.value)}
          mb="sm"
          autoFocus
        />
        <TextInput
          label="Date"
          value={selectedDate ?? ''}
          disabled
          mb="sm"
        />
        <Switch
          label="All day"
          checked={formAllDay}
          onChange={(e) => setFormAllDay(e.currentTarget.checked)}
          mb="sm"
        />
        {!formAllDay && (
          <Group grow mb="sm">
            <TextInput
              label="Time"
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.currentTarget.value)}
            />
            <TextInput
              label="Duration (min)"
              type="number"
              value={formDuration}
              onChange={(e) => setFormDuration(Number(e.currentTarget.value))}
            />
          </Group>
        )}
        <Textarea
          label="Notes"
          value={formNotes}
          onChange={(e) => setFormNotes(e.currentTarget.value)}
          mb="sm"
          autosize
          minRows={2}
        />
        <ColorInput
          label="Color"
          value={formColor}
          onChange={setFormColor}
          mb="md"
        />
        <Group justify="space-between">
          {editingEvent && (
            <Button color="red" variant="light" onClick={() => deleteEvent(editingEvent.id)}>
              Delete
            </Button>
          )}
          <Group ml="auto">
            <Button variant="subtle" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent} loading={saving}>Save</Button>
          </Group>
        </Group>
      </Modal>
    </Container>
  )
}
