import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { fetchFeed } from './api'
import type { FeedOnThisDayEvent } from './types'
import './WidgetOnThisDay.css'

export default function WidgetOnThisDay() {
  const [events, setEvents] = useState<FeedOnThisDayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const now = new Date()
        const data = await fetchFeed(now.getFullYear(), now.getMonth() + 1, now.getDate(), controller.signal)
        if (!controller.signal.aborted) {
          setEvents(data.onthisday.slice(0, 5))
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(true)
          setLoading(false)
        }
      }
    }

    load()
    const id = setInterval(load, 15 * 60 * 1000)
    return () => { controller.abort(); clearInterval(id) }
  }, [])

  if (loading) {
    return (
      <div className="gf-widget-oth">
        <div className="gf-widget-oth__skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gf-widget-oth__skeleton-row">
              <div className="gf-widget-oth__skeleton-year" />
              <div className="gf-widget-oth__skeleton-line" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="gf-widget-oth gf-widget-oth--error">
        <span className="gf-widget-oth__empty">Failed to load</span>
      </div>
    )
  }

  if (events.length === 0) {
    return <div className="gf-widget-oth gf-widget-oth--loading">—</div>
  }

  return (
    <div className="gf-widget-oth">
      <div className="gf-widget-oth__list">
        {events.map((ev, i) => (
          <div key={i} className="gf-widget-oth__event">
            <span className="gf-widget-oth__year">{ev.year}</span>
            <span className="gf-widget-oth__text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ev.text) }} />
          </div>
        ))}
      </div>
    </div>
  )
}
