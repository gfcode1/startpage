import { getStorage } from '@/lib/storage/engine'
import type { CalendarEvent } from './types'

const STORAGE_KEY = 'calendar:events'

export function loadEvents(): CalendarEvent[] {
  return getStorage().get<CalendarEvent[]>(STORAGE_KEY) ?? []
}

export function saveEvents(events: CalendarEvent[]): void {
  getStorage().set(STORAGE_KEY, events)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
