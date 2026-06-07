import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './NewsWidget.css'

interface Article {
  title: string
  link: string
}

function isDev(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

async function fetchFeed(url: string): Promise<Article[]> {
  const feedUrl = isDev()
    ? `/api/rss-proxy?url=${encodeURIComponent(url)}`
    : `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`

  const res = await fetch(feedUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  if (isDev()) {
    const xml = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = doc.querySelectorAll('item')
    return Array.from(items).slice(0, 5).map(item => ({
      title: item.querySelector('title')?.textContent?.trim() || '(no title)',
      link: item.querySelector('link')?.textContent?.trim() || '',
    }))
  }

  const json = await res.json()
  if (json?.status !== 'ok') return []
  const items: Record<string, string | undefined>[] = json.items ?? []
  return items.slice(0, 5).map(item => ({
    title: item.title || '(no title)',
    link: item.link || '',
  }))
}

export default function NewsWidget() {
  const navigate = useNavigate()
  const [feeds] = useAppStorage<string[]>('rssreader', 'feeds', [])
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const prevLenRef = useRef(0)

  useEffect(() => {
    if (feeds.length === 0) return
    let cancelled = false
    const load = async () => {
      try {
        const result = await fetchFeed(feeds[0])
        if (!cancelled) { setArticles(result); setError(false) }
      } catch { if (!cancelled) setError(true) }
    }
    load()
    const id = setInterval(load, 15 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [feeds])

  useEffect(() => {
    if (articles.length !== prevLenRef.current) {
      prevLenRef.current = articles.length
      setIndex(0)
    }
    if (articles.length <= 1) return
    const id = setInterval(() => setIndex(prev => (prev + 1) % articles.length), 6000)
    return () => clearInterval(id)
  }, [articles.length])

  if (feeds.length === 0) {
    return (
      <div className="gf-widget-news">
        <button className="gf-widget-news__action" onClick={() => navigate('/rssreader')}>
          Add feeds in RSS Reader
          <GfIcon name="chevron-right" size={12} />
        </button>
      </div>
    )
  }

  if (error && articles.length === 0) {
    return <div className="gf-widget-news"><span className="gf-widget-news__empty">No news loaded</span></div>
  }

  if (articles.length === 0) {
    return <div className="gf-widget-news gf-widget-news--loading">—</div>
  }

  const article = articles[index]!
  return (
    <div className="gf-widget-news">
      <a className="gf-widget-news__link" href={article.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
        {article.title}
      </a>
      <span className="gf-widget-news__dot">
        {articles.map((_, i) => <span key={i} className={i === index ? 'gf-widget-news__dot--active' : ''} />)}
      </span>
    </div>
  )
}
