import { useState, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { fetchStories, getCachedStories, setCachedStories } from '../HackerNews/api'
import type { HNStory } from '../HackerNews/types'
import './HackerNewsWidget.css'

export default function HackerNewsWidget() {
  const [stories, setStories] = useState<HNStory[]>(() => getCachedStories('top') ?? [])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(!getCachedStories('top'))
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (getCachedStories('top')) return
    fetchStories('top')
      .then(data => {
        setCachedStories('top', data)
        setStories(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (stories.length < 2) return
    intervalRef.current = setInterval(() => {
      setIndex(i => (i + 1) % stories.length)
    }, 8000)
    return () => clearInterval(intervalRef.current)
  }, [stories.length])

  if (loading) {
    return (
      <div className="gf-widget-hn">
        <span className="gf-widget-hn__loading">Loading…</span>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="gf-widget-hn">
        <span className="gf-widget-hn__empty">No stories available</span>
      </div>
    )
  }

  const story = stories[index]

  return (
    <div className="gf-widget-hn">
      <div className="gf-widget-hn__header">
        <GfIcon name="news" size={14} />
        <span className="gf-widget-hn__label">Hacker News</span>
      </div>
      <a
        className="gf-widget-hn__title"
        href={story.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {story.title}
      </a>
      <div className="gf-widget-hn__meta">
        <span className="gf-widget-hn__score">{story.score} pts</span>
        <span className="gf-widget-hn__sep">·</span>
        <span className="gf-widget-hn__author">{story.author}</span>
        <span className="gf-widget-hn__sep">·</span>
        <a
          className="gf-widget-hn__comments"
          href={story.commentsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {story.commentCount} comments
        </a>
      </div>
    </div>
  )
}
