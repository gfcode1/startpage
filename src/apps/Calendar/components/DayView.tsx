import { useMemo } from 'react'
import { parseISO, getEventsForDay, formatTimeDisplay, layoutOverlappingEvents } from '../utils'
import { getCategoryColor, type CalendarEvent } from '../types'

interface DayViewProps {
  activeDate: string
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function DayView({ activeDate, events, onEventClick }: DayViewProps) {
  const dayEvents = useMemo(() => getEventsForDay(events, activeDate), [events, activeDate])
  const allDayEvents = useMemo(() => dayEvents.filter(e => e.allDay), [dayEvents])
  const timedLayout = useMemo(() => {
    return layoutOverlappingEvents(dayEvents.filter(e => !e.allDay))
  }, [dayEvents])

  const hours = useMemo(() => {
    const h: number[] = []
    for (let i = 0; i < 24; i++) h.push(i)
    return h
  }, [])

  const d = parseISO(activeDate)
  const dateLabel = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="gf-calendar__body">
      <div className="gf-calendar__day-view">
        <div className="gf-calendar__day-header">
          <div className="gf-calendar__day-header-date">{dateLabel}</div>
        </div>

        {allDayEvents.map(e => (
          <div
            key={e.id}
            className="gf-calendar__day-col-event"
            style={{
              position: 'relative',
              margin: '2px 8px',
              background: getCategoryColor(e.category) + '25',
              borderLeft: `3px solid ${getCategoryColor(e.category)}`,
            }}
            onClick={() => onEventClick(e)}
          >
            {e.title}
          </div>
        ))}

        <div className="gf-calendar__day-timeline">
          <div className="gf-calendar__day-layout" style={{ position: 'relative', minHeight: `${24 * 48}px` }}>
            {hours.map(h => (
              <div key={h} className="gf-calendar__day-hour" style={{ height: '48px', position: 'relative' }}>
                <span className="gf-calendar__day-hour-label">{formatTimeDisplay(h)}</span>
              </div>
            ))}

            {timedLayout.map(({ event: e, column, totalColumns }) => {
              const startH = parseInt(e.startTime?.split(':')[0] || '0')
              const startM = parseInt(e.startTime?.split(':')[1] || '0')
              const endH = parseInt(e.endTime?.split(':')[0] || '23')
              const endM = parseInt(e.endTime?.split(':')[1] || '59')
              const topPx = (startH * 60 + startM) / 60 * 48
              const durMin = (endH * 60 + endM) - (startH * 60 + startM)
              const heightPx = Math.max(durMin / 60 * 48, 24)

              return (
                <div
                  key={e.id}
                  className="gf-calendar__day-event-block"
                  style={{
                    position: 'absolute',
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                    width: `calc(${100 / totalColumns}% - 6px)`,
                    left: `calc(${100 / totalColumns * column}% + 2px)`,
                    background: getCategoryColor(e.category) + '20',
                    borderLeft: `3px solid ${getCategoryColor(e.category)}`,
                    borderRadius: '4px',
                    padding: '4px 6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                  onClick={() => onEventClick(e)}
                >
                  <strong style={{ fontSize: 12 }}>{e.title}</strong>
                  {e.startTime && <div style={{ fontSize: 10, opacity: 0.7 }}>{e.startTime}{e.endTime ? ` – ${e.endTime}` : ''}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
