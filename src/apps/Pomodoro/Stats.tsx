import { useMemo } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import type { DailyStats } from './types'

interface StatsProps {
  dailyStats: DailyStats[]
  sessionsCompleted: number
}

export function Stats({ dailyStats, sessionsCompleted }: StatsProps) {
  const weekStats = useMemo(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 1)

    return dailyStats.filter(s => {
      const d = new Date(s.date)
      return d >= weekStart && d <= weekEnd
    })
  }, [dailyStats])

  const weekFocus = weekStats.reduce((sum, s) => sum + s.focusTime, 0)
  const bestDay = weekStats.length > 0 ? Math.max(...weekStats.map(s => s.sessionsCompleted)) : 0

  return (
    <div className="gf-pomodoro-stats">
      <h3 className="gf-pomodoro-stats__title">Statistics</h3>
      <div className="gf-pomodoro-stats__grid">
        <div className="gf-pomodoro-stats__card">
          <GfIcon name="check" size={18} />
          <span className="gf-pomodoro-stats__value">{sessionsCompleted}</span>
          <span className="gf-pomodoro-stats__label">Today</span>
        </div>
        <div className="gf-pomodoro-stats__card">
          <GfIcon name="calendar" size={18} />
          <span className="gf-pomodoro-stats__value">{weekFocus}</span>
          <span className="gf-pomodoro-stats__label">Min This Week</span>
        </div>
        <div className="gf-pomodoro-stats__card">
          <GfIcon name="sparkles" size={18} />
          <span className="gf-pomodoro-stats__value">{bestDay}</span>
          <span className="gf-pomodoro-stats__label">Best Day</span>
        </div>
      </div>
    </div>
  )
}
