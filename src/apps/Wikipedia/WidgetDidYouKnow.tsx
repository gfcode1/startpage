import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { useNavigate } from 'react-router-dom'
import { fetchFeed } from './api'
import type { FeedTfa } from './types'
import './WidgetDidYouKnow.css'

export default function WidgetDidYouKnow() {
  const navigate = useNavigate()
  const [tfa, setTfa] = useState<FeedTfa | null>(null)
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
          setTfa(data.tfa)
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
      <div className="gf-widget-dyk">
        <div className="gf-widget-dyk__skeleton">
          <div className="gf-widget-dyk__skeleton-img" />
          <div className="gf-widget-dyk__skeleton-line gf-widget-dyk__skeleton-line--lg" />
          <div className="gf-widget-dyk__skeleton-line" />
          <div className="gf-widget-dyk__skeleton-line gf-widget-dyk__skeleton-line--sm" />
        </div>
      </div>
    )
  }

  if (error && !tfa) {
    return (
      <div className="gf-widget-dyk gf-widget-dyk--error">
        <span className="gf-widget-dyk__empty">Failed to load</span>
      </div>
    )
  }

  if (!tfa) {
    return <div className="gf-widget-dyk gf-widget-dyk--loading">—</div>
  }

  return (
    <div className="gf-widget-dyk" onClick={() => navigate('/wikipedia')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/wikipedia') } }}>
      {tfa.thumbnail && (
        <img className="gf-widget-dyk__img" src={tfa.thumbnail.source} alt="" loading="lazy" />
      )}
      <h3 className="gf-widget-dyk__title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tfa.displaytitle) }} />
      <p className="gf-widget-dyk__extract">{tfa.extract}</p>
    </div>
  )
}
