import { useState, useEffect, useRef } from 'react'
import { fetchFeed } from './api'
import type { FeedNewsItem } from './types'
import './WidgetInTheNews.css'

export default function WidgetInTheNews() {
  const [items, setItems] = useState<FeedNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const prevLenRef = useRef(0)
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
          setItems(data.news)
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

  useEffect(() => {
    if (items.length !== prevLenRef.current) {
      prevLenRef.current = items.length
      setIndex(0)
    }
    if (items.length <= 1) return
    const id = setInterval(() => setIndex(prev => (prev + 1) % items.length), 6000)
    return () => clearInterval(id)
  }, [items.length])

  if (loading) {
    return <div className="gf-widget-itn gf-widget-itn--loading">—</div>
  }

  if (error && items.length === 0) {
    return <div className="gf-widget-itn"><span className="gf-widget-itn__empty">Failed to load news</span></div>
  }

  if (items.length === 0) {
    return <div className="gf-widget-itn gf-widget-itn--loading">—</div>
  }

  const item = items[index]!
  const link = item.links[0]

  return (
    <div className="gf-widget-itn">
      {link ? (
        <a className="gf-widget-itn__link" href={link.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
          {item.story}
        </a>
      ) : (
        <span className="gf-widget-itn__text">{item.story}</span>
      )}
      <span className="gf-widget-itn__dot">
        {items.map((_, i) => <span key={i} className={i === index ? 'gf-widget-itn__dot--active' : ''} />)}
      </span>
    </div>
  )
}
