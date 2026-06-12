import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { normalizeAppData, getUpcomingEvents, parseISO } from '../Calendar/utils'
import { getCategoryColor } from '../Calendar/types'

export default function CalendarWidget() {
  const navigate = useNavigate()
  const [rawData] = useAppStorage('calendar', 'data', null)
  const data = useMemo(() => rawData ? normalizeAppData(rawData) : null, [rawData])

  const upcoming = useMemo(() => {
    if (!data) return []
    return getUpcomingEvents(data.events, 5)
  }, [data])

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Upcoming Events</span>
        <button
          onClick={() => navigate('/calendar')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gf-text-secondary)', display: 'flex', alignItems: 'center', gap: 2, fontSize: 12 }}
        >
          Open <GfIcon name="chevron-right" size={12} />
        </button>
      </div>

      {upcoming.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--gf-text-secondary)', padding: '16px 0', textAlign: 'center' }}>
          No upcoming events
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {upcoming.map(e => {
          const d = parseISO(e.startDate)
          const day = d.getDate()
          const month = d.toLocaleDateString(undefined, { month: 'short' })

          return (
            <div
              key={e.id}
              onClick={() => navigate('/calendar')}
              style={{
                display: 'flex',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                background: 'var(--gf-hover)',
                transition: 'background 0.15s',
                alignItems: 'center',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 36,
                padding: '2px 6px',
                borderRadius: 6,
                background: getCategoryColor(e.category) + '20',
                color: getCategoryColor(e.category),
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>{month}</span>
                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{day}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gf-text-secondary)' }}>
                  {e.allDay ? 'All day' : (e.startTime || '')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
