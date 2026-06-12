import { useMemo } from 'react'
import { getDaysInMonth, getFirstDayOfMonth, isToday, eventOverlapsDate, parseISO, getEventsForDay, layoutMultiDayEvents } from '../utils'
import { WEEKDAY_LABELS, getCategoryColor, type CalendarEvent } from '../types'

const MAX_VISIBLE_EVENTS = 4

interface MonthViewProps {
  activeDate: string
  events: CalendarEvent[]
  onDayClick: (date: string) => void
  onEventClick: (event: CalendarEvent) => void
}

export function MonthView({ activeDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const { year, month } = useMemo(() => {
    const d = parseISO(activeDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [activeDate])

  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const rows: { date: string; day: number; isOutside: boolean }[][] = []
    let row: { date: string; day: number; isOutside: boolean }[] = []

    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const m = String(prevMonth + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      row.push({ date: `${prevYear}-${m}-${d}`, day, isOutside: true })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(month + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      row.push({ date: `${year}-${m}-${d}`, day, isOutside: false })
      if (row.length === 7) {
        rows.push(row)
        row = []
      }
    }

    if (row.length > 0) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      let day = 1
      while (row.length < 7) {
        const m = String(nextMonth + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        row.push({ date: `${nextYear}-${m}-${d}`, day, isOutside: true })
        day++
      }
      rows.push(row)
    }

    return rows
  }, [year, month])

  const multiDayLayout = useMemo(() => {
    const first = days[0][0].date
    const last = days[days.length - 1][6].date
    const visibleMulti = events.filter(e => e.startDate !== e.endDate && e.endDate >= first && e.startDate <= last)
    return layoutMultiDayEvents(visibleMulti)
  }, [events, days])

  const { barHeight } = useMemo(() => {
    const maxCols = Math.max(1, ...multiDayLayout.map(m => m.totalColumns))
    const h = Math.max(18, Math.min(22, 22 - (maxCols - 1) * 2))
    return { barHeight: h }
  }, [multiDayLayout])

  return (
    <div className="gf-calendar__body">
      <div className="gf-calendar__header">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="gf-calendar__header-cell">{label}</div>
        ))}
      </div>
      <div className="gf-calendar__grid">
        {days.map((week, _wi) =>
          week.map(cell => {
            const cellEvents = getEventsForDay(events, cell.date)
            const singleDay = cellEvents
              .filter(e => e.startDate === e.endDate)
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            const ongoing = multiDayLayout.filter(m =>
              eventOverlapsDate(m.event, cell.date)
            )
            const totalSlots = MAX_VISIBLE_EVENTS
            const barsCount = ongoing.length
            const linesCount = singleDay.length
            const visibleLines = singleDay.slice(0, Math.max(0, totalSlots - barsCount))
            const overflow = linesCount - visibleLines.length

            return (
              <div
                key={cell.date}
                className={`gf-calendar__cell${cell.isOutside ? ' gf-calendar__cell--outside' : ''}${isToday(cell.date) ? ' gf-calendar__cell--today' : ''}`}
                onClick={() => onDayClick(cell.date)}
              >
                <div className="gf-calendar__cell-day">{cell.day}</div>

                <div className="gf-calendar__cell-bars" style={{ height: barsCount > 0 ? `${barsCount * barHeight}px` : '0' }}>
                  {ongoing.map(m => {
                    const isFirst = m.event.startDate === cell.date
                    return (
                      <div
                        key={m.event.id}
                        className="gf-calendar__event-bar"
                        style={{
                          background: getCategoryColor(m.event.category),
                          width: `calc(${100 / m.totalColumns}% - 2px)`,
                          marginLeft: `calc(${100 / m.totalColumns * m.column}% + 1px)`,
                          height: `${barHeight - 2}px`,
                          fontSize: `${Math.max(9, barHeight - 8)}px`,
                        }}
                        onClick={e => { e.stopPropagation(); onEventClick(m.event) }}
                      >
                        {isFirst ? m.event.title : ''}
                      </div>
                    )
                  })}
                </div>

                <div className="gf-calendar__cell-lines">
                  {visibleLines.map(e => (
                    <div
                      key={e.id}
                      className="gf-calendar__event-line"
                      onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                    >
                      <span className="gf-calendar__event-line-dot" style={{ background: getCategoryColor(e.category) }} />
                      <span className="gf-calendar__event-line-time">{e.startTime || ''}</span>
                      <span className="gf-calendar__event-line-title">{e.title}</span>
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="gf-calendar__cell-more" onClick={e => { e.stopPropagation(); onDayClick(cell.date) }}>
                      +{overflow} more
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
