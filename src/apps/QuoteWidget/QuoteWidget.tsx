import { useState, useEffect } from 'react'
import './QuoteWidget.css'

interface Quote { content: string; author: string }
const FALLBACK: Quote = { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' }

async function fetchQuote(): Promise<Quote> {
  const res = await fetch('https://dummyjson.com/quotes/random')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return { content: json.quote, author: json.author }
}

export default function QuoteWidget() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try { setQuote(await fetchQuote()); setError(false) }
      catch { if (!cancelled) setError(true) }
    }
    load()
    const id = setInterval(load, 24 * 60 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const q = quote || (error ? FALLBACK : null)
  if (!q) return <div className="gf-widget-quote gf-widget-quote--loading">—</div>

  return (
    <div className="gf-widget-quote">
      <span className="gf-widget-quote__text">"{q.content}"</span>
      <span className="gf-widget-quote__author">— {q.author}</span>
    </div>
  )
}
