import type { CalendarEvent, CalendarAppData } from './types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function todayISO(): string {
  return dateToISO(new Date())
}

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function formatMonthYear(dateStr: string): string {
  const d = parseISO(dateStr)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayISO()
}

export function isSameDay(a: string, b: string): boolean {
  return a === b
}

export function compareDates(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function eventOverlapsDate(event: CalendarEvent, dateStr: string): boolean {
  return dateStr >= event.startDate && dateStr <= event.endDate
}

export function getEventsForDay(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter(e => eventOverlapsDate(e, dateStr))
}

export function getEventsForRange(events: CalendarEvent[], startDate: string, endDate: string): CalendarEvent[] {
  return events.filter(e => e.startDate <= endDate && e.endDate >= startDate)
}

export function getUpcomingEvents(events: CalendarEvent[], limit = 5): CalendarEvent[] {
  const today = todayISO()
  return events
    .filter(e => !e.completed && e.endDate >= today)
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return compareDates(a.startDate, b.startDate)
      return (a.startTime || '').localeCompare(b.startTime || '')
    })
    .slice(0, limit)
}

export function formatEventDate(dateStr: string, timeStr?: string): string {
  const d = parseISO(dateStr)
  const label = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  if (timeStr) return `${label} · ${timeStr}`
  return label
}

export function formatEventRange(startDate: string, endDate: string, startTime: string, endTime: string, allDay: boolean): string {
  if (allDay) {
    if (startDate === endDate) return 'All day'
    return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`
  }
  const start = formatEventDate(startDate, startTime)
  if (startDate === endDate && endTime) return `${start} – ${endTime}`
  if (startDate !== endDate) return `${start} – ${formatEventDate(endDate, endTime)}`
  return start
}

export function formatDateShort(dateStr: string): string {
  return parseISO(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatTimeDisplay(hours: number): string {
  const h = hours % 24
  const m = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface EventLayout {
  event: CalendarEvent
  column: number
  totalColumns: number
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function layoutOverlappingEvents(events: CalendarEvent[]): EventLayout[] {
  const timed = events.filter(e => !e.allDay && e.startTime)
  if (timed.length === 0) return events.map(e => ({ event: e, column: 0, totalColumns: 1 }))

  const sorted = [...timed].sort((a, b) => {
    const aStart = timeToMinutes(a.startTime)
    const bStart = timeToMinutes(b.startTime)
    if (aStart !== bStart) return aStart - bStart
    const aEnd = timeToMinutes(a.endTime || '23:59')
    const bEnd = timeToMinutes(b.endTime || '23:59')
    return bEnd - aEnd
  })

  const columns: number[] = []
  const result: EventLayout[] = []

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime || '00:00')
    const end = timeToMinutes(event.endTime || '23:59')

    let col = 0
    while (col < columns.length && columns[col] > start) {
      col++
    }

    if (col >= columns.length) {
      columns.push(end)
    } else {
      columns[col] = end
    }

    result.push({ event, column: col, totalColumns: 0 })
  }

  const maxCols = columns.length
  for (const item of result) {
    item.totalColumns = maxCols
  }

  const untimed = events.filter(e => e.allDay || !e.startTime)
  return [...result, ...untimed.map(e => ({ event: e, column: 0, totalColumns: 1 }))]
}

export function layoutMultiDayEvents(events: CalendarEvent[]): EventLayout[] {
  const multiDay = events.filter(e => e.startDate !== e.endDate)
  if (multiDay.length <= 1) return multiDay.map(e => ({ event: e, column: 0, totalColumns: 1 }))

  const sorted = [...multiDay].sort((a, b) => {
    if (a.startDate !== b.startDate) return compareDates(a.startDate, b.startDate)
    const aDur = parseISO(a.endDate).getTime() - parseISO(a.startDate).getTime()
    const bDur = parseISO(b.endDate).getTime() - parseISO(b.startDate).getTime()
    return bDur - aDur
  })

  const columns: string[] = []
  const result: EventLayout[] = []

  for (const event of sorted) {
    const start = event.startDate
    let col = 0
    while (col < columns.length && columns[col] >= start) {
      col++
    }
    if (col >= columns.length) {
      columns.push(event.endDate)
    } else {
      columns[col] = event.endDate
    }
    result.push({ event, column: col, totalColumns: 0 })
  }

  const maxCols = columns.length
  for (const item of result) {
    item.totalColumns = maxCols
  }

  return result
}

export function createEvent(data: Partial<CalendarEvent> & { title: string; startDate: string }): CalendarEvent {
  return {
    id: generateId(),
    title: data.title,
    startDate: data.startDate,
    startTime: data.startTime ?? '',
    endDate: data.endDate ?? data.startDate,
    endTime: data.endTime ?? '',
    allDay: data.allDay ?? false,
    category: data.category ?? 'personal',
    notes: data.notes ?? '',
    completed: false,
    createdAt: Date.now(),
  }
}

export function createInitialAppData(): CalendarAppData {
  return {
    events: [],
    view: 'month',
    activeDate: todayISO(),
  }
}

export function normalizeEvent(raw: unknown): CalendarEvent {
  const e = (raw || {}) as Record<string, unknown>
  return {
    id: typeof e.id === 'string' ? e.id : generateId(),
    title: typeof e.title === 'string' ? e.title : 'Untitled',
    startDate: typeof e.startDate === 'string' && ISO_DATE.test(e.startDate) ? e.startDate : todayISO(),
    startTime: typeof e.startTime === 'string' ? e.startTime : '',
    endDate: typeof e.endDate === 'string' && ISO_DATE.test(e.endDate) ? e.endDate : todayISO(),
    endTime: typeof e.endTime === 'string' ? e.endTime : '',
    allDay: !!e.allDay,
    category: (e.category === 'personal' || e.category === 'work' || e.category === 'health' || e.category === 'finance' || e.category === 'other') ? e.category : 'personal',
    notes: typeof e.notes === 'string' ? e.notes : '',
    completed: !!e.completed,
    createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
  }
}

export function normalizeAppData(raw: unknown): CalendarAppData {
  const d = (raw || {}) as Record<string, unknown>
  const view = d.view === 'month' || d.view === 'week' || d.view === 'day' || d.view === 'agenda' ? d.view : 'month'
  const activeDate = typeof d.activeDate === 'string' && ISO_DATE.test(d.activeDate) ? d.activeDate : todayISO()
  return {
    events: Array.isArray(d.events) ? d.events.map(normalizeEvent) : [],
    view,
    activeDate,
  }
}
