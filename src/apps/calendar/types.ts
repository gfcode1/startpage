export interface CalendarEvent {
  id: string
  title: string
  date: string
  endDate?: string
  time?: string
  duration?: number
  allDay: boolean
  notes?: string
  color: string
  categoryId?: string
}

export type CalendarView = 'month' | 'week' | 'agenda'

export interface EventCategory {
  id: string
  name: string
  color: string
}
