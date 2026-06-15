import { useState, useCallback } from 'react'
import { Container, Group, Button, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { useCalendarStore, useCalendarView } from './store'
import { CalendarHeader } from './components/calendar-header'
import { CalendarGrid } from './components/calendar-grid'
import { WeekView } from './components/week-view'
import { AgendaView } from './components/agenda-view'
import { EventModal } from './components/event-modal'
import { CategoryManager } from './components/category-manager'
import { getTodayStr } from './utils'
import type { CalendarEvent } from './types'

export default function CalendarApp() {
  const view = useCalendarView()
  const events = useCalendarStore((s) => s.events)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [defaultTime, setDefaultTime] = useState<string | undefined>(undefined)

  const openNewEvent = useCallback((dateOrStr: string) => {
    let dateStr = dateOrStr
    let time: string | undefined
    if (dateOrStr.includes('T')) {
      const parts = dateOrStr.split('T')
      dateStr = parts[0]!
      time = parts[1]!
    }
    setDefaultTime(time)
    setSelectedDate(dateStr)
    setEditingEvent(null)
    setModalOpen(true)
  }, [])

  const openEditEvent = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event) {
      setSelectedDate(event.date)
      setEditingEvent(event)
      setModalOpen(true)
    }
  }, [events])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingEvent(null)
  }, [])

  useHotkeys([
    ['alt + N', () => openNewEvent(getTodayStr())],
  ])

  return (
    <Container size="lg" py="md">
      <CalendarHeader />

      <Group mb="sm" gap="xs">
        <Button
          variant="light"
          size="compact-sm"
          leftSection={<Icon icon="lucide:plus" width={14} />}
          onClick={() => openNewEvent(getTodayStr())}
        >
          Event
        </Button>
        <Tooltip label="Manage categories">
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<Icon icon="lucide:tags" width={14} />}
            onClick={() => setCategoryModalOpen(true)}
          >
            Categories
          </Button>
        </Tooltip>
      </Group>

      {view === 'month' && (
        <CalendarGrid onDateClick={openNewEvent} onEventClick={openEditEvent} />
      )}
      {view === 'week' && (
        <WeekView onDateClick={openNewEvent} onEventClick={openEditEvent} />
      )}
      {view === 'agenda' && (
        <AgendaView onEventClick={openEditEvent} />
      )}

      <EventModal
        opened={modalOpen}
        onClose={closeModal}
        editingEvent={editingEvent}
        selectedDate={selectedDate}
        defaultTime={defaultTime}
      />

      <CategoryManager
        opened={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />
    </Container>
  )
}
