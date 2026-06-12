export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type EventCategory = 'personal' | 'work' | 'health' | 'finance' | 'other'

export interface CalendarEvent {
  id: string
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  category: EventCategory
  notes: string
  completed: boolean
  createdAt: number
}

export interface CalendarAppData {
  events: CalendarEvent[]
  view: CalendarView
  activeDate: string
}

export const CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'personal', label: 'Personal', color: '#22c55e' },
  { value: 'work', label: 'Work', color: '#3b82f6' },
  { value: 'health', label: 'Health', color: '#ef4444' },
  { value: 'finance', label: 'Finance', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#8b5cf6' },
]

export function getCategoryColor(category: EventCategory): string {
  return CATEGORIES.find(c => c.value === category)?.color ?? '#8b5cf6'
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
