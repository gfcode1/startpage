export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getWeekDates(year: number, month: number, day: number): string[] {
  const date = new Date(year, month, day)
  const dayOfWeek = date.getDay()
  const start = new Date(date)
  start.setDate(date.getDate() - dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate())
  })
}

export function getHours(): string[] {
  return Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`,
  )
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr()
}

export function getCategoryColor(categoryId: string | undefined, categories: { id: string; color: string }[]): string {
  if (!categoryId) return '#d4763a'
  return categories.find((c) => c.id === categoryId)?.color ?? '#d4763a'
}
