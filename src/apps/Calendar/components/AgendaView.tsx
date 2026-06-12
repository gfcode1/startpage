import { useMemo } from 'react'
import { getEventsForRange, todayISO, parseISO, compareDates } from '../utils'
import { getCategoryColor, type CalendarEvent } from '../types'

interface AgendaViewProps {
  activeDate: string
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function AgendaView({ activeDate, events, onEventClick }: AgendaViewProps) {
  const grouped = useMemo(() => {
    const d = parseISO(activeDate)
    const start = todayISO()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`

    const inRange = getEventsForRange(events, start, endStr)
      .filter(e => !e.completed)
      .sort((a, b) => {
        if (a.startDate !== b.startDate) return compareDates(a.startDate, b.startDate)
        return (a.startTime || '').localeCompare(b.startTime || '')
      })

    const groups: { date: string; label: string; events: CalendarEvent[] }[] = []
    let currentDate = ''
    let currentGroup: CalendarEvent[] = []

    for (const e of inRange) {
      if (e.startDate !== currentDate) {
        if (currentGroup.length > 0) {
          const d2 = parseISO(currentDate)
          const label = d2.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
          groups.push({ date: currentDate, label, events: currentGroup })
        }
        currentDate = e.startDate
        currentGroup = []
      }
      currentGroup.push(e)
    }
    if (currentGroup.length > 0) {
      const d2 = parseISO(currentDate)
      const label = d2.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
      groups.push({ date: currentDate, label, events: currentGroup })
    }

    return groups
  }, [activeDate, events])

  if (grouped.length === 0) {
    return (
      <div className="gf-calendar__body">
        <div className="gf-calendar__empty">
          <div className="gf-calendar__empty-title">No upcoming events</div>
          <div className="gf-calendar__empty-desc">Add an event to get started</div>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-calendar__body">
      <div className="gf-calendar__agenda">
        {grouped.map(group => (
          <div key={group.date} className="gf-calendar__agenda-day">
            <div className="gf-calendar__agenda-day-header">{group.label}</div>
            {group.events.map(e => (
              <div
                key={e.id}
                className={`gf-calendar__agenda-event${e.completed ? ' gf-calendar__agenda-event--completed' : ''}`}
                onClick={() => onEventClick(e)}
              >
                <div className="gf-calendar__agenda-category" style={{ background: getCategoryColor(e.category) }} />
                <div className="gf-calendar__agenda-time">
                  {e.allDay ? 'All day' : (e.startTime || '')}
                </div>
                <div className="gf-calendar__agenda-content">
                  <div className="gf-calendar__agenda-title">{e.title}</div>
                  {e.notes && <div className="gf-calendar__agenda-notes">{e.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
