import { describe, it, expect, beforeEach } from 'vitest'
import { useCalendarStore, getFilteredEvents } from '../store'
import { resetStorage } from '@/lib/storage/engine'
import type { CalendarEvent } from '../types'

function getMockEvent(overrides?: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: '1',
    title: 'Test Event',
    date: '2025-01-15',
    allDay: true,
    color: '#d4763a',
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  resetStorage()
  useCalendarStore.setState({
    events: [],
    categories: [],
    year: 2025,
    month: 0,
    view: 'month',
    searchQuery: '',
    categoryFilter: null,
  })
})

describe('useCalendarStore', () => {
  describe('addEvent', () => {
    it('adds an event with generated id', () => {
      useCalendarStore.getState().addEvent({
        title: 'New',
        date: '2025-01-20',
        allDay: true,
        color: '#ff0000',
      })
      const store = useCalendarStore.getState()
      expect(store.events).toHaveLength(1)
      expect(store.events[0]!.title).toBe('New')
      expect(store.events[0]!.id).toBeTruthy()
    })
  })

  describe('updateEvent', () => {
    it('updates an existing event', () => {
      useCalendarStore.getState().addEvent({
        title: 'Original',
        date: '2025-01-20',
        allDay: true,
        color: '#ff0000',
      })
      const id = useCalendarStore.getState().events[0]!.id
      useCalendarStore.getState().updateEvent(id, { title: 'Updated' })
      expect(useCalendarStore.getState().events[0]!.title).toBe('Updated')
    })

    it('does nothing for non-existent id', () => {
      useCalendarStore.getState().updateEvent('non-existent', { title: 'Nope' })
      expect(useCalendarStore.getState().events).toHaveLength(0)
    })
  })

  describe('deleteEvent', () => {
    it('removes an event by id', () => {
      useCalendarStore.getState().addEvent({
        title: 'To Delete',
        date: '2025-01-20',
        allDay: true,
        color: '#ff0000',
      })
      const id = useCalendarStore.getState().events[0]!.id
      useCalendarStore.getState().deleteEvent(id)
      expect(useCalendarStore.getState().events).toHaveLength(0)
    })
  })

  describe('moveEvent', () => {
    it('changes the date of an event', () => {
      useCalendarStore.getState().addEvent({
        title: 'Movable',
        date: '2025-01-20',
        time: '10:00',
        allDay: false,
        duration: 60,
        color: '#ff0000',
      })
      const id = useCalendarStore.getState().events[0]!.id
      useCalendarStore.getState().moveEvent(id, '2025-02-01')
      const ev = useCalendarStore.getState().events[0]!
      expect(ev.date).toBe('2025-02-01')
      expect(ev.time).toBe('10:00')
    })
  })

  describe('navigateMonth', () => {
    it('goes to next month', () => {
      useCalendarStore.getState().navigateMonth(1)
      expect(useCalendarStore.getState().month).toBe(1)
    })

    it('goes to previous month with year rollover', () => {
      useCalendarStore.getState().navigateMonth(-1)
      expect(useCalendarStore.getState().year).toBe(2024)
      expect(useCalendarStore.getState().month).toBe(11)
    })
  })

  describe('goToToday', () => {
    it('resets to current month/year', () => {
      useCalendarStore.setState({ year: 2000, month: 0 })
      useCalendarStore.getState().goToToday()
      const d = new Date()
      expect(useCalendarStore.getState().year).toBe(d.getFullYear())
      expect(useCalendarStore.getState().month).toBe(d.getMonth())
    })
  })

  describe('setView', () => {
    it('changes active view', () => {
      useCalendarStore.getState().setView('week')
      expect(useCalendarStore.getState().view).toBe('week')
    })
  })

  describe('categories', () => {
    it('adds a category', () => {
      useCalendarStore.getState().addCategory('Work', '#ff0000')
      expect(useCalendarStore.getState().categories).toHaveLength(1)
      expect(useCalendarStore.getState().categories[0]!.name).toBe('Work')
    })

    it('updates a category', () => {
      useCalendarStore.getState().addCategory('Work', '#ff0000')
      const id = useCalendarStore.getState().categories[0]!.id
      useCalendarStore.getState().updateCategory(id, { name: 'Personal' })
      expect(useCalendarStore.getState().categories[0]!.name).toBe('Personal')
    })

    it('deleting a category removes it from events', () => {
      useCalendarStore.getState().addCategory('Work', '#ff0000')
      const catId = useCalendarStore.getState().categories[0]!.id
      useCalendarStore.getState().addEvent({
        title: 'Work Event',
        date: '2025-01-20',
        allDay: true,
        color: '#ff0000',
        categoryId: catId,
      })
      useCalendarStore.getState().deleteCategory(catId)
      expect(useCalendarStore.getState().categories).toHaveLength(0)
      expect(useCalendarStore.getState().events[0]!.categoryId).toBeUndefined()
    })
  })
})

describe('getFilteredEvents', () => {
  const events = [
    getMockEvent({ id: '1', title: 'Meeting', notes: 'Important' }),
    getMockEvent({ id: '2', title: 'Lunch', notes: 'With team' }),
    getMockEvent({ id: '3', title: 'Gym', categoryId: 'cat1' }),
  ]

  it('returns all events when no filters', () => {
    expect(getFilteredEvents(events, '', null)).toHaveLength(3)
  })

  it('filters by search query (title)', () => {
    const result = getFilteredEvents(events, 'meet', null)
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Meeting')
  })

  it('filters by search query (notes)', () => {
    expect(getFilteredEvents(events, 'team', null)).toHaveLength(1)
  })

  it('filters by category', () => {
    const result = getFilteredEvents(events, '', 'cat1')
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Gym')
  })

  it('combines search and category filters', () => {
    expect(getFilteredEvents(events, 'gym', 'cat1')).toHaveLength(1)
    expect(getFilteredEvents(events, 'meeting', 'cat1')).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(getFilteredEvents(events, 'MEETING', null)).toHaveLength(1)
    expect(getFilteredEvents(events, 'MEET', null)).toHaveLength(1)
  })
})
