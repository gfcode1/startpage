import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBadge } from '../../framework/components/Badge'
import { fetchAndParseFeed, fetchAndParseArticle } from './rssParser'
import type { Article, FeedResult } from './types'
import './RssReaderApp.css'

const APP_ID = 'rssreader'

export default function RssReaderApp() {
  const [feeds, setFeeds] = useAppStorage<string[]>(APP_ID, 'feeds', [])
  const [readIds, setReadIds] = useAppStorage<string[]>(APP_ID, 'read', [])
  const [results, setResults] = useState<FeedResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editText, setEditText] = useState('')
  const [filterFeed, setFilterFeed] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [drawerArticle, setDrawerArticle] = useState<Article | null>(null)
  const [drawerContent, setDrawerContent] = useState<{
    title: string
    content: string
    excerpt: string
    byline: string | null
  } | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (feeds.length === 0) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      const all: FeedResult[] = []
      const CONCURRENCY = 4
      for (let i = 0; i < feeds.length; i += CONCURRENCY) {
        const batch = feeds.slice(i, i + CONCURRENCY)
        const batchResults = await Promise.all(batch.map(url => fetchAndParseFeed(url)))
        if (cancelled) return
        all.push(...batchResults)
      }
      if (!cancelled) {
        setResults(all)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [feeds, refreshKey])

  const allArticles = useMemo(() => {
    const seen = new Set<string>()
    const articles: Article[] = []

    for (const r of results) {
      for (const a of r.articles) {
        if (!seen.has(a.id)) {
          seen.add(a.id)
          articles.push(a)
        }
      }
    }

    articles.sort((a, b) => b.pubDateParsed - a.pubDateParsed)
    return articles
  }, [results])

  const feedNames = useMemo(() => {
    const names = results.map(r => r.feed.title).filter(Boolean)
    return ['all', ...Array.from(new Set(names))]
  }, [results])

  const filteredArticles = useMemo(() => {
    return allArticles.filter(a => {
      const matchFeed = filterFeed === 'all' || a.feedTitle === filterFeed
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
      return matchFeed && matchSearch
    })
  }, [allArticles, filterFeed, search])

  const unreadCount = useMemo(() => {
    return allArticles.filter(a => !readIds.includes(a.id)).length
  }, [allArticles, readIds])

  const handleArticleClick = useCallback(async (article: Article) => {
    setReadIds(prev => prev.includes(article.id) ? prev : [...prev, article.id])
    setDrawerArticle(article)
    setDrawerContent(null)
    setDrawerError(null)
    setDrawerLoading(true)
    try {
      const content = await fetchAndParseArticle(article.link)
      setDrawerContent(content)
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to load article')
    } finally {
      setDrawerLoading(false)
    }
  }, [setReadIds])

  const handleCloseDrawer = useCallback(() => {
    setDrawerArticle(null)
    setDrawerContent(null)
    setDrawerError(null)
  }, [])

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!drawerArticle) return

    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleCloseDrawer()
        return
      }

      if (e.key !== 'Tab' || !drawerRef.current) return

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerArticle, handleCloseDrawer])

  const openEditor = useCallback(() => {
    setEditText(feeds.join('\n'))
    setShowEditor(true)
  }, [feeds])

  const saveFeeds = useCallback(() => {
    const urls = editText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && (l.startsWith('http://') || l.startsWith('https://')))
    setFeeds(urls)
    setShowEditor(false)
  }, [editText, setFeeds])

  const cancelEditor = useCallback(() => {
    setShowEditor(false)
  }, [])

  const feedSegments = feedNames.map(name => ({
    value: name,
    label: name === 'all' ? 'All' : name,
  }))

  const totalErrors = results.filter(r => r.error).length

  return (
    <div className="gf-rssreader">
      <AppHeader
        title="RSS Reader"
        badge={allArticles.length > 0 ? `${allArticles.length} articles` : undefined}
        segments={feedSegments.length > 1 ? feedSegments : undefined}
        segmentValue={filterFeed}
        onSegmentChange={setFilterFeed}
        searchPlaceholder="Search articles..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="gf-rssreader__toolbar">
        <div className="gf-rssreader__toolbar-left">
          {loading ? (
            <span className="gf-rssreader__status">Loading feeds...</span>
          ) : (
            <>
              <GfBadge variant="listeners">
                {unreadCount} unread
              </GfBadge>
              {totalErrors > 0 && (
                <GfBadge variant="warning">
                  {totalErrors} error{totalErrors > 1 ? 's' : ''}
                </GfBadge>
              )}
            </>
          )}
        </div>
        <div className="gf-rssreader__toolbar-right">
          <button className="gf-rssreader__btn" onClick={() => setRefreshKey(k => k + 1)} disabled={loading || feeds.length === 0}>
            <GfIcon name="refresh" size={14} />
            Refresh
          </button>
          <button className="gf-rssreader__btn gf-rssreader__btn--secondary" onClick={openEditor}>
            <GfIcon name="edit" size={14} />
            Manage Feeds
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="gf-rssreader__editor">
          <div className="gf-rssreader__editor-header">
            <h3 className="gf-rssreader__editor-title">Feed URLs</h3>
            <span className="gf-rssreader__editor-hint">One URL per line</span>
          </div>
          <textarea
            className="gf-rssreader__editor-textarea"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder="https://example.com/rss&#10;https://other.site/feed.xml&#10;..."
            rows={8}
            spellCheck={false}
          />
          <div className="gf-rssreader__editor-actions">
            <button className="gf-rssreader__btn" onClick={saveFeeds}>Save</button>
            <button className="gf-rssreader__btn gf-rssreader__btn--secondary" onClick={cancelEditor}>Cancel</button>
          </div>
        </div>
      )}

      {feeds.length === 0 && !showEditor && (
        <div className="gf-rssreader__empty">
          <GfIcon name="rss" size={48} />
          <p>No feeds configured yet</p>
          <button className="gf-rssreader__btn" onClick={openEditor}>Add your first feed</button>
        </div>
      )}

      {feeds.length > 0 && !loading && filteredArticles.length === 0 && allArticles.length > 0 && (
        <div className="gf-rssreader__empty">
          <p>No articles match your filter</p>
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="gf-rssreader__list">
          {filteredArticles.map((article, _i) => {
            const isRead = readIds.includes(article.id)
            return (
              <div
                key={article.id}
                className={`gf-rssreader__card ${isRead ? 'gf-rssreader__card--read' : ''}`}
                onClick={() => handleArticleClick(article)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') handleArticleClick(article) }}
              >
                {article.mediaThumbnail && (
                  <div className="gf-rssreader__card-thumb">
                    <img src={article.mediaThumbnail} alt="" loading="lazy" />
                  </div>
                )}
                <div className="gf-rssreader__card-body">
                  <div className="gf-rssreader__card-meta">
                    <GfBadge variant="default">{article.feedTitle}</GfBadge>
                    {article.pubDateParsed > 0 && (
                      <span className="gf-rssreader__card-date">
                        {new Date(article.pubDateParsed).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="gf-rssreader__card-title">
                    {!isRead && <span className="gf-rssreader__unread-dot" />}
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="gf-rssreader__card-desc">{article.description.slice(0, 300)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="gf-rssreader__loading">
          <div className="gf-rssreader__spinner" />
          <p>Fetching feeds...</p>
        </div>
      )}

      {drawerArticle && (
        <>
          <div className="gf-rssreader__drawer-overlay" onClick={handleCloseDrawer} />
          <aside className="gf-rssreader__drawer" role="dialog" aria-label={drawerArticle.title} ref={drawerRef}>
            <div className="gf-rssreader__drawer-header">
              <div className="gf-rssreader__drawer-header-top">
                <a
                  className="gf-rssreader__drawer-original"
                  href={drawerArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View original page
                  <GfIcon name="external-link" size={12} />
                </a>
                <button className="gf-rssreader__drawer-close" onClick={handleCloseDrawer} aria-label="Close drawer">
                  <GfIcon name="close" size={18} />
                </button>
              </div>
              <h2 className="gf-rssreader__drawer-title">{drawerArticle.title}</h2>
              {drawerContent?.byline && (
                <p className="gf-rssreader__drawer-byline">{drawerContent.byline}</p>
              )}
            </div>
            <div className="gf-rssreader__drawer-body">
              {drawerLoading && (
                <div className="gf-rssreader__drawer-loading">
                  <div className="gf-rssreader__spinner" />
                  <p>Loading article...</p>
                </div>
              )}
              {drawerError && (
                <div className="gf-rssreader__drawer-error">
                  <p>Failed to load article content.</p>
                  <p className="gf-rssreader__drawer-error-detail">{drawerError}</p>
                  <a className="gf-rssreader__drawer-fallback-link" href={drawerArticle.link} target="_blank" rel="noopener noreferrer">
                    Open original page instead
                  </a>
                </div>
              )}
              {drawerContent && (
                <div
                  className="gf-rssreader__drawer-article"
                  dangerouslySetInnerHTML={{ __html: drawerContent.content }}
                />
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
