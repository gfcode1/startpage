import { useState, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import './WordOfDayWidget.css'

interface WordData { word: string; definition: string; author?: string }

const FALLBACK_WORDS: WordData[] = [
  { word: 'Serendipity', definition: 'The occurrence of events by chance in a happy or beneficial way.' },
  { word: 'Ephemeral', definition: 'Lasting for a very short time.' },
  { word: 'Resilience', definition: 'The capacity to recover quickly from difficulties.' },
  { word: 'Ubiquitous', definition: 'Present, appearing, or found everywhere.' },
  { word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing.' },
]

function fetchWord(): Promise<WordData> {
  return fetch('https://api.urbandictionary.com/v0/random')
    .then(r => r.json())
    .then(data => {
      if (data?.list?.[0]) {
        return {
          word: data.list[0].word,
          definition: data.list[0].definition.replace(/\[|\]/g, '').split('\n')[0],
          author: data.list[0].author,
        }
      }
      throw new Error('No data')
    })
    .catch(() => {
      const i = new Date().getDate() % FALLBACK_WORDS.length
      return FALLBACK_WORDS[i]
    })
}

export default function WordOfDayWidget() {
  const [data, setData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const raw = localStorage.getItem('gf:wordofday:data')
        const ts = localStorage.getItem('gf:wordofday:ts')
        if (raw && ts && Date.now() - Number(ts) < 86400000) {
          if (!cancelled) { setData(JSON.parse(raw)); setLoading(false) }
          return
        }
      } catch { /* ignore */ }
      const d = await fetchWord()
      if (!cancelled) {
        setData(d)
        localStorage.setItem('gf:wordofday:data', JSON.stringify(d))
        localStorage.setItem('gf:wordofday:ts', String(Date.now()))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="gf-widget-wordday">
      <div className="gf-widget-wordday__header">
        <GfIcon name="book-open" size={14} />
        <span className="gf-widget-wordday__label">Word of the Day</span>
      </div>
      {loading ? (
        <span className="gf-widget-wordday__loading">Loading…</span>
      ) : data ? (
        <>
          <span className="gf-widget-wordday__word">{data.word}</span>
          <span className="gf-widget-wordday__def">{data.definition}</span>
        </>
      ) : (
        <span className="gf-widget-wordday__loading">No word available</span>
      )}
    </div>
  )
}
