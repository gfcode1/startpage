import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { CalendarEvent, CalendarView, EventCategory } from './types'
import { generateId } from '@/lib/utils/id'
import { getStorage } from '@/lib/storage/engine'

const EVENTS_KEY = 'calendar:events'
const CATEGORIES_KEY = 'calendar:categories'
export const STORAGE_KEY = EVENTS_KEY

function loadEvents(): CalendarEvent[] {
  return getStorage().get<CalendarEvent[]>(EVENTS_KEY) ?? []
}

function saveEvents(events: CalendarEvent[]): void {
  getStorage().set(EVENTS_KEY, events)
}

function loadCategories(): EventCategory[] {
  return getStorage().get<EventCategory[]>(CATEGORIES_KEY) ?? []
}

function saveCategories(categories: EventCategory[]): void {
  getStorage().set(CATEGORIES_KEY, categories)
}

interface CalendarState {
  events: CalendarEvent[]
  categories: EventCategory[]
  year: number
  month: number
  view: CalendarView
  searchQuery: string
  categoryFilter: string | null
}

interface CalendarActions {
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  moveEvent: (id: string, date: string, time?: string) => void
  navigateMonth: (delta: number) => void
  goToToday: () => void
  setView: (view: CalendarView) => void
  setSearchQuery: (query: string) => void
  setCategoryFilter: (categoryId: string | null) => void
  addCategory: (name: string, color: string) => void
  updateCategory: (id: string, updates: Partial<EventCategory>) => void
  deleteCategory: (id: string) => void
}

export type CalendarStore = CalendarState & CalendarActions

const today = new Date()

export const useCalendarStore = create<CalendarStore>()(
  subscribeWithSelector((set) => ({
    events: loadEvents(),
    categories: loadCategories(),
    year: today.getFullYear(),
    month: today.getMonth(),
    view: 'month' as CalendarView,
    searchQuery: '',
    categoryFilter: null,

    addEvent: (event) => {
      set((state) => ({
        events: [...state.events, { ...event, id: generateId() }],
      }))
    },

    updateEvent: (id, updates) => {
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      }))
    },

    deleteEvent: (id) => {
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }))
    },

    moveEvent: (id, date, time) => {
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, date, time: time ?? e.time } : e,
        ),
      }))
    },

    navigateMonth: (delta) => {
      set((state) => {
        const d = new Date(state.year, state.month + delta, 1)
        return { year: d.getFullYear(), month: d.getMonth() }
      })
    },

    goToToday: () => {
      const d = new Date()
      set({ year: d.getFullYear(), month: d.getMonth() })
    },

    setView: (view) => set({ view }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

    addCategory: (name, color) => {
      set((state) => ({
        categories: [...state.categories, { id: generateId(), name, color }],
      }))
    },

    updateCategory: (id, updates) => {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      }))
    },

    deleteCategory: (id) => {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        events: state.events.map((e) =>
          e.categoryId === id ? { ...e, categoryId: undefined } : e,
        ),
      }))
    },
  })),
)

useCalendarStore.subscribe((state) => {
  if (getIsRehydrating()) return
  saveEvents(state.events)
  saveCategories(state.categories)
})

export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter((e) => {
    if (e.endDate) {
      return date >= e.date && date <= e.endDate
    }
    return e.date === date
  })
}

export function getFilteredEvents(
  events: CalendarEvent[],
  searchQuery: string,
  categoryFilter: string | null,
): CalendarEvent[] {
  return events.filter((e) => {
    if (categoryFilter && e.categoryId !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!e.title.toLowerCase().includes(q) && !(e.notes ?? '').toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })
}

// Selectors
export const useCalendarEvents = () => useCalendarStore((s) => s.events)
export const useCalendarCategories = () => useCalendarStore((s) => s.categories)
export const useCalendarYear = () => useCalendarStore((s) => s.year)
export const useCalendarMonth = () => useCalendarStore((s) => s.month)
export const useCalendarView = () => useCalendarStore((s) => s.view)
export const useCalendarSearchQuery = () => useCalendarStore((s) => s.searchQuery)
export const useCalendarCategoryFilter = () => useCalendarStore((s) => s.categoryFilter)

// Rehydration
import { getIsRehydrating, registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const events = storage.get<CalendarEvent[]>(EVENTS_KEY)
  if (events) useCalendarStore.setState({ events })
  const categories = storage.get<EventCategory[]>(CATEGORIES_KEY)
  if (categories) useCalendarStore.setState({ categories })
})
