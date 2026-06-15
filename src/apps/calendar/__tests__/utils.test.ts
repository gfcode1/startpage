import { describe, it, expect } from 'vitest'
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  getWeekDates,
  isToday,
} from '../utils'

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31)
  })

  it('returns 28 for February in non-leap year', () => {
    expect(getDaysInMonth(2025, 1)).toBe(28)
  })

  it('returns 29 for February in leap year', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2025, 3)).toBe(30)
  })
})

describe('getFirstDayOfMonth', () => {
  it('returns 0-6 range', () => {
    const day = getFirstDayOfMonth(2025, 0)
    expect(day).toBeGreaterThanOrEqual(0)
    expect(day).toBeLessThanOrEqual(6)
  })

  it('returns 3 (Wed) for Jan 1 2025', () => {
    expect(getFirstDayOfMonth(2025, 0)).toBe(3)
  })
})

describe('formatDate', () => {
  it('formats date as YYYY-MM-DD with padding', () => {
    expect(formatDate(2025, 0, 1)).toBe('2025-01-01')
    expect(formatDate(2025, 11, 31)).toBe('2025-12-31')
    expect(formatDate(2025, 6, 5)).toBe('2025-07-05')
  })
})

describe('getWeekDates', () => {
  it('returns 7 dates starting from Sunday', () => {
    // Jan 15 2025 is a Wednesday
    const dates = getWeekDates(2025, 0, 15)
    expect(dates).toHaveLength(7)
    // Should start Sunday Jan 12
    expect(dates[0]).toBe('2025-01-12')
    expect(dates[6]).toBe('2025-01-18')
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date().toISOString().slice(0, 10))).toBe(true)
  })

  it('returns false for yesterday', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    expect(isToday(d.toISOString().slice(0, 10))).toBe(false)
  })
})
