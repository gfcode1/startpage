import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBadge } from '../../framework/components/Badge'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { useToast } from '../../framework/ToastContext'
import { useTopbar } from '../../framework/TopbarContext'
import { fetchStories, getCachedStories, setCachedStories } from './api'
import { fetchAndParseArticle } from '../RssReader/rssParser'
import type { HNStory, HNCategory } from './types'
import './HackerNewsApp.css'

const APP_ID = 'hackernews'

const CATEGORIES: { value: HNCategory; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
  { value: 'show', label: 'Show' },
  { value: 'ask', label: 'Ask' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'best', label: 'Best' },
]

export default function HackerNewsApp() {
  const [stories, setStories] = useState<HNStory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useAppStorage<HNCategory>(APP_ID, 'category', 'top')
  const [savedIds, setSavedIds] = useAppStorage<string[]>(APP_ID, 'saved', [])
  const [readIds, setReadIds] = useAppStorage<string[]>(APP_ID, 'read', [])
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedStory, setSelectedStory] = useState<HNStory | null>(null)
  const [drawerContent, setDrawerContent] = useState<{ title: string; content: string; excerpt: string; byline: string | null } | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const { setActions, setSearch: setTopbarSearch, clearConfig } = useTopbar()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const cached = getCachedStories(category)
      if (cached) {
        setStories(cached)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await fetchStories(category)
        if (!cancelled) {
          setStories(data)
          setCachedStories(category, data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [category, refreshKey])

  const filteredStories = useMemo(() => {
    if (!search) return stories
    const q = search.toLowerCase()
    return stories.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.author.toLowerCase().includes(q)
    )
  }, [stories, search])

  useEffect(() => {
    setActions([
      { id: 'refresh', icon: 'refresh', label: 'Refresh', onClick: () => setRefreshKey(k => k + 1) },
    ])
    setTopbarSearch({ placeholder: 'Search stories...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, setActions, setTopbarSearch, clearConfig])

  useEffect(() => {
    if (!selectedStory) return
    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>('.gf-hackernews__drawer-close')
    closeBtn?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelectedStory(null); return }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selectedStory])

  const handleStoryClick = useCallback(async (story: HNStory) => {
    setReadIds(prev => prev.includes(story.id) ? prev : [...prev, story.id])
    setSelectedStory(story)
    setDrawerContent(null)
    setDrawerError(null)

    const cacheKey = `gf:hackernews:article:${story.id}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setDrawerContent(JSON.parse(cached))
        return
      }
    } catch { /* ignore */ }

    setDrawerLoading(true)
    try {
      const content = await fetchAndParseArticle(story.link)
      try { localStorage.setItem(cacheKey, JSON.stringify(content)) } catch { /* quota */ }
      setDrawerContent(content)
    } catch {
      setDrawerError('Failed to load article content.')
    } finally {
      setDrawerLoading(false)
    }
  }, [setReadIds])

  const toggleSaved = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSavedIds(prev => {
      if (prev.includes(id)) {
        addToast('Removed from saved', 'success')
        return prev.filter(s => s !== id)
      }
      addToast('Story saved', 'success')
      return [...prev, id]
    })
  }, [setSavedIds, addToast])

  const segmentValue = category
  const segmentOptions = CATEGORIES.map(c => ({ value: c.value, label: c.label }))

  return (
    <div className="gf-hackernews">
      <AppHeader
        badge={stories.length > 0 ? `${stories.length} stories` : undefined}
        segments={segmentOptions}
        segmentValue={segmentValue}
        onSegmentChange={v => setCategory(v as HNCategory)}
      />

      <div className="gf-hackernews__toolbar">
        <div className="gf-hackernews__toolbar-left">
          {loading ? (
            <span className="gf-hackernews__status">Loading...</span>
          ) : (
            <>
              <GfBadge variant="listeners">{stories.length} stories</GfBadge>
              {savedIds.length > 0 && (
                <GfBadge variant="accent">{savedIds.length} saved</GfBadge>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="gf-hackernews__error">
          <GfIcon name="alert" size={14} />
          <span>{error}</span>
          <button className="gf-hackernews__retry-btn" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {!loading && filteredStories.length === 0 && !error && (
        <GfEmptyState
          icon={<GfIcon name="news" size={24} />}
          title="No stories found"
          description={search ? 'Try a different search term' : 'Check back later for new stories'}
        />
      )}

      {filteredStories.length > 0 && (
        <div className="gf-hackernews__list">
          {filteredStories.map(story => {
            const isRead = readIds.includes(story.id)
            const isSaved = savedIds.includes(story.id)
            return (
              <div
                key={story.id}
                className={`gf-hackernews__card ${isRead ? 'gf-hackernews__card--read' : ''}`}
                onClick={() => handleStoryClick(story)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStoryClick(story) } }}
              >
                <div className="gf-hackernews__card-score">
                  <GfIcon name="sparkles" size={12} />
                  <span>{story.score}</span>
                </div>
                <div className="gf-hackernews__card-body">
                  <div className="gf-hackernews__card-meta">
                    <span className="gf-hackernews__card-author">{story.author}</span>
                    {story.pubDateParsed > 0 && (
                      <span className="gf-hackernews__card-date">
                        {new Date(story.pubDateParsed).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                    <a
                      className="gf-hackernews__card-comments"
                      href={story.commentsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      {story.commentCount} comment{story.commentCount !== 1 ? 's' : ''}
                    </a>
                  </div>
                  <h3 className="gf-hackernews__card-title">
                    {!isRead && <span className="gf-hackernews__unread-dot" />}
                    {story.title}
                  </h3>
                </div>
                <button
                  className={`gf-hackernews__save-btn ${isSaved ? 'gf-hackernews__save-btn--saved' : ''}`}
                  onClick={e => toggleSaved(e, story.id)}
                  aria-label={isSaved ? 'Unsave' : 'Save'}
                >
                  <GfIcon name={isSaved ? 'heart' : 'heart-outline'} size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="gf-hackernews__loading">
          <div className="gf-hackernews__spinner" />
          <p>Fetching stories...</p>
        </div>
      )}

      {selectedStory && (
        <>
          <div className="gf-hackernews__drawer-overlay" onClick={() => setSelectedStory(null)} role="presentation" />
          <aside className="gf-hackernews__drawer" role="dialog" aria-label={selectedStory.title} ref={drawerRef}>
            <div className="gf-hackernews__drawer-header">
              <div className="gf-hackernews__drawer-header-top">
                <div className="gf-hackernews__drawer-header-links">
                  <a
                    className="gf-hackernews__drawer-link"
                    href={selectedStory.commentsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GfIcon name="message-circle" size={12} />
                    View on HN
                  </a>
                  <a
                    className="gf-hackernews__drawer-link"
                    href={selectedStory.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GfIcon name="external-link" size={12} />
                    Open original
                  </a>
                </div>
                <button className="gf-hackernews__drawer-close" onClick={() => setSelectedStory(null)} aria-label="Close drawer">
                  <GfIcon name="close" size={18} />
                </button>
              </div>
              <h2 className="gf-hackernews__drawer-title">{selectedStory.title}</h2>
              <div className="gf-hackernews__drawer-meta">
                <GfBadge variant="listeners">▲ {selectedStory.score} points</GfBadge>
                <GfBadge variant="default">{selectedStory.author}</GfBadge>
                <GfBadge variant="accent">{selectedStory.commentCount} comments</GfBadge>
              </div>
            </div>
            <div className="gf-hackernews__drawer-body">
              {drawerLoading && (
                <div className="gf-hackernews__drawer-loading">
                  <div className="gf-hackernews__spinner" />
                  <p>Loading article...</p>
                </div>
              )}
              {drawerError && (
                <div className="gf-hackernews__drawer-error">
                  <p>{drawerError}</p>
                  <a className="gf-hackernews__drawer-fallback-link" href={selectedStory.link} target="_blank" rel="noopener noreferrer">
                    Open original page instead
                  </a>
                </div>
              )}
              {drawerContent && (
                <div
                  className="gf-hackernews__drawer-article"
                  dangerouslySetInnerHTML={{ __html: drawerContent.content }}
                />
              )}
              {!drawerLoading && !drawerContent && !drawerError && (
                <div className="gf-hackernews__drawer-loading">
                  <div className="gf-hackernews__spinner" />
                  <p>Loading article...</p>
                </div>
              )}
              <div className="gf-hackernews__drawer-bottom-actions">
                <button
                  className={`gf-hackernews__drawer-action-btn ${savedIds.includes(selectedStory.id) ? 'gf-hackernews__drawer-action-btn--saved' : ''}`}
                  onClick={() => {
                    setSavedIds(prev => {
                      if (prev.includes(selectedStory.id)) {
                        addToast('Removed from saved', 'success')
                        return prev.filter(s => s !== selectedStory.id)
                      }
                      addToast('Story saved', 'success')
                      return [...prev, selectedStory.id]
                    })
                  }}
                >
                  <GfIcon name={savedIds.includes(selectedStory.id) ? 'heart' : 'heart-outline'} size={14} />
                  {savedIds.includes(selectedStory.id) ? 'Saved' : 'Save story'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
