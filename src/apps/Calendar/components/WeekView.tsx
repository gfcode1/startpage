import { useMemo } from 'react'
import { parseISO, isToday, getEventsForDay, dateToISO, formatTimeDisplay, layoutOverlappingEvents } from '../utils'
import { WEEKDAY_LABELS, getCategoryColor, type CalendarEvent } from '../types'

interface WeekViewProps {
  activeDate: string
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function WeekView({ activeDate, events, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const d = parseISO(activeDate)
    const dayOfWeek = d.getDay()
    const days: { date: string; label: string; num: number }[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(d)
      date.setDate(d.getDate() - dayOfWeek + i)
      const dateStr = dateToISO(date)
      days.push({
        date: dateStr,
        label: WEEKDAY_LABELS[date.getDay()],
        num: date.getDate(),
      })
    }
    return days
  }, [activeDate])

  const hours = useMemo(() => {
    const h: number[] = []
    for (let i = 0; i < 24; i++) h.push(i)
    return h
  }, [])

  return (
    <div className="gf-calendar__body">
      <div className="gf-calendar__week-view">
        <div className="gf-calendar__week-header">
          <div />
          {weekDays.map(day => (
            <div key={day.date} className={`gf-calendar__week-header-cell${isToday(day.date) ? ' gf-calendar__week-header-cell--today' : ''}`}>
              {day.label}
              <span className="gf-calendar__week-header-num">{day.num}</span>
            </div>
          ))}
        </div>

        <div className="gf-calendar__week-body">
          <div className="gf-calendar__time-col">
            {hours.map(h => (
              <div key={h} className="gf-calendar__time-slot">{formatTimeDisplay(h)}</div>
            ))}
          </div>

          {weekDays.map(day => {
            const dayEvents = getEventsForDay(events, day.date).filter(e => !e.allDay)
            const layout = layoutOverlappingEvents(dayEvents)

            return (
              <div key={day.date} className={`gf-calendar__day-col${isToday(day.date) ? ' gf-calendar__day-col--today' : ''}`}>
                {layout.map(({ event: e, column, totalColumns }) => {
                  const startH = parseInt(e.startTime?.split(':')[0] || '0')
                  const startM = parseInt(e.startTime?.split(':')[1] || '0')
                  const endH = parseInt(e.endTime?.split(':')[0] || '23')
                  const endM = parseInt(e.endTime?.split(':')[1] || '59')
                  const startPct = (startH * 60 + startM) / (24 * 60) * 100
                  const durMin = (endH * 60 + endM) - (startH * 60 + startM)
                  const durPct = Math.max(durMin / (24 * 60) * 100, 2.5)

                  return (
                    <div
                      key={e.id}
                      className="gf-calendar__day-col-event"
                      style={{
                        top: `${startPct}%`,
                        height: `${durPct}%`,
                        width: `calc(${100 / totalColumns}% - 3px)`,
                        left: `calc(${100 / totalColumns * column}% + 1px)`,
                        background: getCategoryColor(e.category) + '25',
                        borderLeft: `3px solid ${getCategoryColor(e.category)}`,
                      }}
                      onClick={() => onEventClick(e)}
                    >
                      {e.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
