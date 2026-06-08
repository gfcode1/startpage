import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBadge } from '../../framework/components/Badge'
import { useToast } from '../../framework/ToastContext'
import { fetchAndParseFeed, fetchAndParseArticle, parseOpml, downloadOpml, getCachedData, setCachedData, getCachedFeedKey, getCachedArticleKey, isOnline } from './rssParser'
import type { Article, FeedResult, FeedConfig, DrawerContent } from './types'
import './RssReaderApp.css'

const APP_ID = 'rssreader'

function normalizeFeeds(raw: unknown): FeedConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  let feeds: FeedConfig[]
  if (typeof raw[0] === 'string') {
    feeds = (raw as string[]).map(url => ({ url, category: 'Uncategorized', title: '' }))
  } else {
    feeds = raw as FeedConfig[]
  }
  const seen = new Set<string>()
  return feeds.filter(f => {
    const key = f.url.trim().toLowerCase().replace(/\/+$/, '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function RssReaderApp() {
  const [rawFeeds, setRawFeeds] = useAppStorage<unknown>(APP_ID, 'feeds', [])
  const [readIds, setReadIds] = useAppStorage<string[]>(APP_ID, 'read', [])
  const [results, setResults] = useState<FeedResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editFeeds, setEditFeeds] = useState<FeedConfig[]>([])
  const [filterFeed, setFilterFeed] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [drawerArticle, setDrawerArticle] = useState<Article | null>(null)
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [offline, setOffline] = useState(!isOnline())
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const feeds = useMemo(() => normalizeFeeds(rawFeeds), [rawFeeds])

  useEffect(() => {
    const handler = () => setOffline(!navigator.onLine)
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (feeds.length === 0) {
        setResults([])
        setLoading(false)
        return
      }

      if (offline) {
        const cached: FeedResult[] = []
        for (const f of feeds) {
          const cachedResult = getCachedData<FeedResult>(getCachedFeedKey(f.url))
          if (cachedResult) cached.push(cachedResult)
        }
        if (cached.length > 0) {
          setResults(cached)
        }
        setLoading(false)
        return
      }

      setLoading(true)
      const all: FeedResult[] = []
      const CONCURRENCY = 4
      for (let i = 0; i < feeds.length; i += CONCURRENCY) {
        const batch = feeds.slice(i, i + CONCURRENCY)
        const batchResults = await Promise.all(batch.map(f => fetchAndParseFeed(f.url)))
        if (cancelled) return
        all.push(...batchResults)
      }
      if (!cancelled) {
        for (const r of all) {
          if (!r.error) {
            setCachedData(getCachedFeedKey(r.feed.url), r)
          }
        }
        setResults(all)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [feeds, refreshKey, offline])

  const allArticles = useMemo(() => {
    const seen = new Set<string>()
    const articles: Article[] = []

    for (const r of results) {
      for (const a of r.articles) {
        if (!seen.has(a.id)) {
          seen.add(a.id)
          articles.push({
            ...a,
            cachedContent: undefined,
            cachedAt: undefined,
          })
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

  const categories = useMemo(() => {
    const cats = new Set(feeds.map(f => f.category).filter(Boolean))
    return ['all', ...Array.from(cats).sort()]
  }, [feeds])

  const filteredArticles = useMemo(() => {
    return allArticles.filter(a => {
      const feed = feeds.find(f => f.url === a.feedUrl)
      const matchFeed = filterFeed === 'all' || a.feedTitle === filterFeed
      const matchCategory = filterCategory === 'all' || feed?.category === filterCategory
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
      return matchFeed && matchCategory && matchSearch
    })
  }, [allArticles, filterFeed, filterCategory, search, feeds])

  const unreadCount = useMemo(() => {
    return allArticles.filter(a => !readIds.includes(a.id)).length
  }, [allArticles, readIds])

  const cachedArticleIds = useMemo(() => {
    const set = new Set<string>()
    for (const a of allArticles) {
      const cached = getCachedData<DrawerContent>(getCachedArticleKey(a.id))
      if (cached) set.add(a.id)
    }
    return set
  }, [allArticles])

  const handleArticleClick = useCallback(async (article: Article) => {
    setReadIds(prev => prev.includes(article.id) ? prev : [...prev, article.id])
    setDrawerArticle(article)
    setDrawerContent(null)
    setDrawerError(null)

    const cachedContent = getCachedData<DrawerContent>(getCachedArticleKey(article.id))
    if (cachedContent && offline) {
      setDrawerContent(cachedContent)
      return
    }

    setDrawerLoading(true)
    try {
      const content = await fetchAndParseArticle(article.link)
      setCachedData(getCachedArticleKey(article.id), content)
      setDrawerContent(content)
    } catch (err) {
      const fallback = getCachedData<DrawerContent>(getCachedArticleKey(article.id))
      if (fallback) {
        setDrawerContent(fallback)
      } else {
        setDrawerError(err instanceof Error ? err.message : 'Failed to load article')
      }
    } finally {
      setDrawerLoading(false)
    }
  }, [setReadIds, offline])

  const handleCloseDrawer = useCallback(() => {
    setDrawerArticle(null)
    setDrawerContent(null)
    setDrawerError(null)
  }, [])

  useEffect(() => {
    if (!drawerArticle) return

    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>('.gf-rssreader__drawer-close')
    closeBtn?.focus()

    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { handleCloseDrawer(); return }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
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
  }, [drawerArticle, handleCloseDrawer])

  const openEditor = useCallback(() => {
    setEditFeeds(feeds.length > 0 ? [...feeds] : [{ url: '', category: 'Uncategorized', title: '' }])
    setShowEditor(true)
  }, [feeds])

  const saveFeeds = useCallback(() => {
    const valid = editFeeds
      .map(f => ({ ...f, url: f.url.trim(), category: f.category || 'Uncategorized' }))
      .filter(f => f.url.startsWith('http://') || f.url.startsWith('https://'))
    setRawFeeds(valid)
    setShowEditor(false)
  }, [editFeeds, setRawFeeds])

  const cancelEditor = useCallback(() => {
    setShowEditor(false)
  }, [])

  const handleImportOpml = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseOpml(text)
      const existingUrls = new Set(feeds.map(f => f.url))
      const merged = [...feeds]
      for (const f of imported) {
        if (!existingUrls.has(f.url)) {
          merged.push(f)
          existingUrls.add(f.url)
        }
      }
      setRawFeeds(merged)
      addToast(`Imported ${imported.length} feeds`, 'success')
    } catch {
      addToast('Failed to import OPML file', 'error')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [feeds, setRawFeeds, addToast])

  const handleExportOpml = useCallback(() => {
    if (feeds.length === 0) return
    downloadOpml(feeds)
    addToast('OPML file downloaded', 'success')
  }, [feeds, addToast])

  const addFeedRow = useCallback(() => {
    setEditFeeds(prev => [...prev, { url: '', category: 'Uncategorized', title: '' }])
  }, [])

  const removeFeedRow = useCallback((index: number) => {
    setEditFeeds(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateFeedRow = useCallback((index: number, field: keyof FeedConfig, value: string) => {
    setEditFeeds(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }, [])

  const feedSegments = feedNames.map(name => ({
    value: name,
    label: name === 'all' ? 'All' : name,
  }))

  const categorySegments = categories.map(c => ({
    value: c,
    label: c === 'all' ? 'All Categories' : c,
  }))

  const handleMarkAllRead = useCallback(() => {
    setReadIds(prev => {
      const existing = new Set(prev)
      for (const a of filteredArticles) existing.add(a.id)
      return Array.from(existing)
    })
  }, [filteredArticles, setReadIds])

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

      {offline && (
        <div className="gf-rssreader__offline-banner">
          <GfIcon name="cloud-off" size={14} />
          Offline — showing cached content
        </div>
      )}

      {categories.length > 1 && (
        <div className="gf-rssreader__category-row">
          {categorySegments.map(c => (
            <button
              key={c.value}
              className={`gf-rssreader__category-chip ${filterCategory === c.value ? 'gf-rssreader__category-chip--active' : ''}`}
              onClick={() => setFilterCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="gf-rssreader__toolbar">
        <div className="gf-rssreader__toolbar-left">
          {loading ? (
            <span className="gf-rssreader__status">Loading feeds...</span>
          ) : (
            <>
              <GfBadge variant="listeners">
                {unreadCount} unread
              </GfBadge>
              {offline && allArticles.length > 0 && (
                <GfBadge variant="default">
                  Cached
                </GfBadge>
              )}
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
          <button className="gf-rssreader__btn" onClick={handleMarkAllRead} disabled={filteredArticles.length === 0 || unreadCount === 0}>
            <GfIcon name="check-double" size={14} />
            Mark all read
          </button>
          <button className="gf-rssreader__btn" onClick={handleExportOpml} disabled={feeds.length === 0} title="Export OPML">
            <GfIcon name="download" size={14} />
          </button>
          <button className="gf-rssreader__btn" onClick={() => fileInputRef.current?.click()} title="Import OPML">
            <GfIcon name="upload" size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept=".opml,.xml,.json" style={{ display: 'none' }} onChange={handleImportOpml} />
          <button className="gf-rssreader__btn gf-rssreader__btn--secondary" onClick={openEditor}>
            <GfIcon name="edit" size={14} />
            Manage Feeds
          </button>
        </div>
      </div>

      {results.filter(r => r.error).length > 0 && (
        <div className="gf-rssreader__feed-errors">
          {results.filter(r => r.error).map((r, i) => (
            <div key={i} className="gf-rssreader__feed-error-row">
              <span className="gf-rssreader__feed-error-name">{r.feed.title || r.feed.url}</span>
              <span className="gf-rssreader__feed-error-msg">{r.error}</span>
              <button className="gf-rssreader__feed-error-retry" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
                <GfIcon name="refresh" size={12} />
                Retry
              </button>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="gf-rssreader__editor">
          <div className="gf-rssreader__editor-header">
            <h3 className="gf-rssreader__editor-title">Feed List</h3>
            <button className="gf-rssreader__btn" onClick={addFeedRow}>
              <GfIcon name="plus" size={12} />
              Add Feed
            </button>
          </div>
          <div className="gf-rssreader__editor-list">
            {editFeeds.map((feed, i) => (
              <div key={i} className="gf-rssreader__editor-row">
                <input
                  className="gf-rssreader__editor-url"
                  type="text"
                  value={feed.url}
                  onChange={e => updateFeedRow(i, 'url', e.target.value)}
                  placeholder="https://example.com/rss"
                  aria-label="Feed URL"
                />
                <input
                  className="gf-rssreader__editor-category"
                  type="text"
                  value={feed.category}
                  onChange={e => updateFeedRow(i, 'category', e.target.value)}
                  placeholder="Category"
                  aria-label="Category"
                  list="rss-categories"
                />
                <button
                  className="gf-rssreader__editor-remove"
                  onClick={() => removeFeedRow(i)}
                  aria-label="Remove feed"
                  disabled={editFeeds.length <= 1}
                >
                  <GfIcon name="close" size={12} />
                </button>
              </div>
            ))}
            <datalist id="rss-categories">
              <option value="News" />
              <option value="Tech" />
              <option value="Blogs" />
              <option value="Design" />
              <option value="Science" />
              <option value="Uncategorized" />
            </datalist>
          </div>
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
          {filteredArticles.map((article) => {
            const isRead = readIds.includes(article.id)
            const hasCache = cachedArticleIds.has(article.id)
            const feedConfig = feeds.find(f => f.url === article.feedUrl)
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
                    {feedConfig?.category && feedConfig.category !== 'Uncategorized' && (
                      <GfBadge variant="listeners">{feedConfig.category}</GfBadge>
                    )}
                    {hasCache && offline && (
                      <span className="gf-rssreader__card-cached" title="Available offline">Cached</span>
                    )}
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
