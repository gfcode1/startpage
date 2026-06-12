import { useState, useMemo, useCallback } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { useAppBadge } from '../../framework/AppBadgeContext'
import { MonthView } from './components/MonthView'
import { WeekView } from './components/WeekView'
import { DayView } from './components/DayView'
import { AgendaView } from './components/AgendaView'
import { EventForm } from './components/EventForm'
import {
  createInitialAppData,
  normalizeAppData,
  generateId,
  todayISO,
  parseISO,
  dateToISO,
  formatMonthYear,
  getUpcomingEvents,
} from './utils'
import type { CalendarEvent, CalendarView } from './types'
import './CalendarApp.css'

const APP_ID = 'calendar'
const STORAGE_KEY = 'data'

const VIEW_SEGMENTS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
]

export default function CalendarApp() {
  const [rawData, setData] = useAppStorage(APP_ID, STORAGE_KEY, createInitialAppData())
  const data = useMemo(() => normalizeAppData(rawData), [rawData])
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState(todayISO())
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const { addToast } = useToast()
  const { setBadge } = useAppBadge('calendar')

  const today = todayISO()

  const upcomingCount = useMemo(() => getUpcomingEvents(data.events, 20).length, [data.events])
  useMemo(() => setBadge(upcomingCount > 0 ? upcomingCount : 0), [upcomingCount, setBadge])

  const navigateMonth = useCallback((delta: number) => {
    setData(prev => {
      const d = normalizeAppData(prev)
      const date = parseISO(d.activeDate)
      date.setMonth(date.getMonth() + delta)
      return { ...d, activeDate: dateToISO(date) }
    })
  }, [setData])

  const navigateWeek = useCallback((delta: number) => {
    setData(prev => {
      const d = normalizeAppData(prev)
      const date = parseISO(d.activeDate)
      date.setDate(date.getDate() + delta * 7)
      return { ...d, activeDate: dateToISO(date) }
    })
  }, [setData])

  const navigateDay = useCallback((delta: number) => {
    setData(prev => {
      const d = normalizeAppData(prev)
      const date = parseISO(d.activeDate)
      date.setDate(date.getDate() + delta)
      return { ...d, activeDate: dateToISO(date) }
    })
  }, [setData])

  const goToday = useCallback(() => {
    setData(prev => ({ ...normalizeAppData(prev), activeDate: todayISO() }))
  }, [setData])

  const setView = useCallback((view: string) => {
    setData(prev => ({ ...normalizeAppData(prev), view: view as CalendarView }))
  }, [setData])

  const updateEvents = useCallback((updater: (prev: CalendarEvent[]) => CalendarEvent[]) => {
    setData(prev => {
      const d = normalizeAppData(prev)
      return { ...d, events: updater(d.events) }
    })
  }, [setData])

  const handleDayClick = useCallback((date: string) => {
    setDefaultDate(date)
    setEditingEvent(null)
    setFormOpen(true)
  }, [])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setDefaultDate(event.startDate)
    setEditingEvent(event)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback((formData: Partial<CalendarEvent> & { title: string; startDate: string }) => {
    if (editingEvent) {
      updateEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as CalendarEvent : e))
      addToast('Event updated', 'success')
    } else {
      const newEvent: CalendarEvent = {
        id: generateId(),
        title: formData.title,
        startDate: formData.startDate,
        startTime: formData.startTime ?? '',
        endDate: formData.endDate ?? formData.startDate,
        endTime: formData.endTime ?? '',
        allDay: formData.allDay ?? false,
        category: formData.category ?? 'personal',
        notes: formData.notes ?? '',
        completed: false,
        createdAt: Date.now(),
      }
      updateEvents(prev => [...prev, newEvent])
      addToast('Event created', 'success')
    }
    setFormOpen(false)
    setEditingEvent(null)
  }, [editingEvent, updateEvents, addToast])

  const handleDelete = useCallback(() => {
    if (!editingEvent) return
    setDeleteConfirm(true)
  }, [editingEvent])

  const confirmDelete = useCallback(() => {
    if (!editingEvent) return
    updateEvents(prev => prev.filter(e => e.id !== editingEvent.id))
    addToast('Event deleted', 'success')
    setFormOpen(false)
    setEditingEvent(null)
    setDeleteConfirm(false)
  }, [editingEvent, updateEvents, addToast])

  const handleNav = useCallback((delta: number) => {
    if (data.view === 'month') navigateMonth(delta)
    else if (data.view === 'week') navigateWeek(delta)
    else navigateDay(delta)
  }, [data.view, navigateMonth, navigateWeek, navigateDay])

  const thisMonth = formatMonthYear(data.activeDate)

  return (
    <div className="gf-calendar">
      <div className="gf-calendar__nav">
        <div className="gf-calendar__nav-btns">
          <button className="gf-calendar__today-btn" onClick={goToday}>
            Today
          </button>
        </div>
        <div className="gf-calendar__nav-title">{thisMonth}</div>
        <div className="gf-calendar__nav-btns">
          <button className="gf-calendar__today-btn" onClick={() => handleNav(-1)}>
            <GfIcon name="chevron-left" size={16} />
          </button>
          <button className="gf-calendar__today-btn" onClick={() => handleNav(1)}>
            <GfIcon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <AppHeader
        segments={VIEW_SEGMENTS}
        segmentValue={data.view}
        onSegmentChange={setView}
      />

      {data.view === 'month' && (
        <MonthView
          activeDate={data.activeDate}
          events={data.events}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
        />
      )}
      {data.view === 'week' && (
        <WeekView
          activeDate={data.activeDate}
          events={data.events}
          onEventClick={handleEventClick}
        />
      )}
      {data.view === 'day' && (
        <DayView
          activeDate={data.activeDate}
          events={data.events}
          onEventClick={handleEventClick}
        />
      )}
      {data.view === 'agenda' && (
        <AgendaView
          activeDate={data.activeDate}
          events={data.events}
          onEventClick={handleEventClick}
        />
      )}

      <button className="gf-calendar__fab" onClick={() => { setEditingEvent(null); setDefaultDate(today); setFormOpen(true) }} aria-label="Add event">
        <GfIcon name="plus" size={20} />
      </button>

      <GfBottomSheet
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        title={editingEvent ? 'Edit Event' : 'New Event'}
      >
        <EventForm
          event={editingEvent}
          defaultDate={defaultDate}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        />
      </GfBottomSheet>

      <GfConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
