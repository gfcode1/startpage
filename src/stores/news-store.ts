import { create } from 'zustand'
import { getStorage } from '@/lib/storage/engine'
import type { FeedSource, NewsArticle, ArticleCache, ReaderSettings, ViewMode, SortBy, AutoRefresh, RetentionDays, FeedStats } from '@/apps/news/types'
import { DEFAULT_READER_SETTINGS } from '@/apps/news/types'
import { fetchAndParseFeed, uniqueByLink, MAX_ARTICLES_PER_FEED, getFeedTitleFromUrl } from '@/apps/news/utils'
import { generateId } from '@/lib/utils/id'
import catalogData from '@/apps/news/news-catalog.json'

const RETENTION_DEFAULT: RetentionDays = 30
const REFRESH_INTERVALS: Record<AutoRefresh, number | null> = {
  off: null,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
}

interface NewsState {
  catalog: FeedSource[]
  enabledFeedIds: string[]
  customFeeds: FeedSource[]
  articles: Record<string, ArticleCache>
  bookmarks: string[]
  searchQuery: string
  selectedCategory: string | null
  selectedCountry: string | null
  activeArticle: NewsArticle | null
  viewMode: ViewMode
  showBookmarksOnly: boolean
  showUnreadOnly: boolean
  sortBy: SortBy
  readerSettings: ReaderSettings
  isRefreshing: boolean
  feedErrors: string[]
  readerCache: Record<string, string>
  autoRefreshInterval: AutoRefresh
  retentionDays: RetentionDays
  feedStats: Record<string, FeedStats>

  init: () => void
  toggleFeed: (feedId: string) => void
  addCustomFeed: (url: string) => Promise<void>
  removeFeed: (feedId: string) => void
  refreshAllFeeds: () => Promise<void>
  refreshFeed: (feed: FeedSource) => Promise<NewsArticle[]>
  markAsRead: (articleId: string) => void
  markAllRead: () => void
  toggleBookmark: (articleId: string) => void
  setActiveArticle: (article: NewsArticle | null) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (cat: string | null) => void
  setSelectedCountry: (country: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setShowBookmarksOnly: (show: boolean) => void
  setShowUnreadOnly: (show: boolean) => void
  setSortBy: (sort: SortBy) => void
  setReaderSettings: (settings: ReaderSettings) => void
  getEnabledFeeds: () => FeedSource[]
  getUnreadCount: () => number
  cacheReaderContent: (id: string, html: string) => void
  getCachedReaderContent: (id: string) => string | null
  setAutoRefreshInterval: (interval: AutoRefresh) => void
  setRetentionDays: (days: RetentionDays) => void
  cleanOldArticles: () => void
  getRefreshIntervalMs: () => number | null
}

export const useNewsStore = create<NewsState>((set, get) => ({
  catalog: [],
  enabledFeedIds: [],
  customFeeds: [],
  articles: {},
  bookmarks: [],
  searchQuery: '',
  selectedCategory: null,
  selectedCountry: null,
  activeArticle: null,
  viewMode: 'grid',
  showBookmarksOnly: false,
  showUnreadOnly: false,
  sortBy: 'newest',
  readerSettings: DEFAULT_READER_SETTINGS,
  isRefreshing: false,
  feedErrors: [],
  readerCache: {},
  autoRefreshInterval: 'off',
  retentionDays: RETENTION_DEFAULT,
  feedStats: {},

  init: () => {
    const storage = getStorage()
    const enabled = storage.get<string[]>('news:feeds') ?? []
    const custom = storage.get<FeedSource[]>('news:custom') ?? []
    const cached = storage.get<Record<string, ArticleCache>>('news:articles') ?? {}
    const bookmarks = storage.get<string[]>('news:bookmarks') ?? []
    const reader = storage.get<ReaderSettings>('news:reader') ?? DEFAULT_READER_SETTINGS
    const view = storage.get<ViewMode>('news:view') ?? 'grid'

    const feeds = (catalogData as { feeds: FeedSource[] }).feeds ?? []
    const savedEnabled = enabled.filter((id) => feeds.some((f) => f.id === id))
    const validCustom = (custom ?? []).filter((f) => f.url)

    const sanitized: Record<string, ArticleCache> = {}
    let needsSave = false
    for (const [key, cache] of Object.entries(cached)) {
      const items = cache.items.map((a) => {
        const author = typeof a.author === 'string' ? a.author : undefined
        const feedTitle = typeof a.feedTitle === 'string' ? a.feedTitle : ''
        if (author !== a.author || feedTitle !== a.feedTitle) needsSave = true
        return { ...a, author, feedTitle }
      })
      sanitized[key] = { items, fetchedAt: cache.fetchedAt }
    }
    if (needsSave) storage.set('news:articles', sanitized)

    set({
      catalog: feeds,
      enabledFeedIds: savedEnabled,
      customFeeds: validCustom,
      articles: sanitized,
      bookmarks,
      readerSettings: reader,
      viewMode: view,
    })

    const autoRefresh = storage.get<AutoRefresh>('news:autoRefresh') ?? 'off'
    const retention = storage.get<RetentionDays>('news:retention') ?? RETENTION_DEFAULT
    const savedStats = storage.get<string>('news:feedStats')
    let feedStats: Record<string, FeedStats> = {}
    if (savedStats) {
      try { feedStats = JSON.parse(savedStats) } catch { /* ignore */ }
    }
    set({ autoRefreshInterval: autoRefresh, retentionDays: retention, feedStats })
    get().cleanOldArticles()
  },

  toggleFeed: (feedId) => {
    const { enabledFeedIds } = get()
    const isCurrentlyEnabled = enabledFeedIds.includes(feedId)
    const updated = isCurrentlyEnabled
      ? enabledFeedIds.filter((id) => id !== feedId)
      : [...enabledFeedIds, feedId]
    set({ enabledFeedIds: updated })
    getStorage().set('news:feeds', updated)
    if (!isCurrentlyEnabled) {
      const feed = get().getEnabledFeeds().find((f) => f.id === feedId)
      if (feed) get().refreshFeed(feed)
    }
  },

  addCustomFeed: async (url) => {
    const { customFeeds } = get()
    const exists = customFeeds.some((f) => f.url === url)
    if (exists) return

    const title = getFeedTitleFromUrl(url)
    const feed: FeedSource = {
      id: `custom-${generateId().slice(0, 8)}`,
      title,
      url,
      category: 'Custom',
    }

    const updated = [...customFeeds, feed]
    set({ customFeeds: updated })
    getStorage().set('news:custom', updated)

    await get().refreshFeed(feed)
  },

  removeFeed: (feedId) => {
    const { enabledFeedIds, customFeeds, articles } = get()
    const newEnabled = enabledFeedIds.filter((id) => id !== feedId)
    const newCustom = customFeeds.filter((f) => f.id !== feedId)
    const newArticles = { ...articles }
    delete newArticles[feedId]

    set({ enabledFeedIds: newEnabled, customFeeds: newCustom, articles: newArticles })
    getStorage().set('news:feeds', newEnabled)
    getStorage().set('news:custom', newCustom)
    getStorage().set('news:articles', newArticles)
  },

  refreshAllFeeds: async () => {
    const feeds = get().getEnabledFeeds()
    if (feeds.length === 0) return
    if (get().isRefreshing) return

    const prevArticles = get().articles
    const prevLinks = new Set<string>()
    for (const cache of Object.values(prevArticles)) {
      for (const item of cache.items) {
        prevLinks.add(item.link)
      }
    }

    set({ isRefreshing: true, feedErrors: [] })

    const errors: string[] = []
    const batchSize = 4
    const newArticles: NewsArticle[] = []
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize)
      const results = await Promise.allSettled(batch.map((f) => get().refreshFeed(f)))
      results.forEach((r, j) => {
        if (r.status === 'fulfilled') {
          for (const article of r.value) {
            if (!prevLinks.has(article.link)) {
              newArticles.push(article)
            }
          }
        } else {
          const feed = batch[j]
          if (feed) errors.push(feed.title)
        }
      })
      if (i + batchSize < feeds.length) {
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    // Collect errors from feedStats for feeds that had fetch failures
    const finalStats = get().feedStats
    for (const feed of feeds) {
      const s = finalStats[feed.id]
      if (s && s.errorCount > 0 && !errors.includes(feed.title)) {
        errors.push(feed.title)
      }
    }

    set({ isRefreshing: false, feedErrors: errors })

    if (newArticles.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const count = newArticles.length
      const top = newArticles.slice(0, 3)
      if (count === 1 && top[0]) {
        new Notification(top[0].feedTitle, { body: top[0].title, icon: top[0].imageUrl })
      } else {
        new Notification(`${count} new articles`, {
          body: top.map((a) => a.title).join('\n'),
        })
      }
    }
  },

  refreshFeed: async (feed) => {
    if (!feed) return []

    try {
      const articles = await fetchAndParseFeed(feed)

      const existing = get().articles[feed.id]
      const merged = uniqueByLink([...(existing?.items ?? []), ...articles])
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, MAX_ARTICLES_PER_FEED)

      const newArticles = {
        ...get().articles,
        [feed.id]: { items: merged, fetchedAt: Date.now() },
      }

      const stats = { ...get().feedStats }
      stats[feed.id] = { lastFetched: Date.now(), errorCount: 0 }

      set({ articles: newArticles, feedStats: stats })
      getStorage().set('news:articles', newArticles)
      getStorage().set('news:feedStats', JSON.stringify(stats))

      return articles
    } catch {
      const stats = { ...get().feedStats }
      const existing = stats[feed.id]
      stats[feed.id] = {
        lastFetched: existing?.lastFetched ?? 0,
        errorCount: (existing?.errorCount ?? 0) + 1,
      }
      set({ feedStats: stats })
      getStorage().set('news:feedStats', JSON.stringify(stats))
      return []
    }
  },

  markAsRead: (articleId) => {
    const { articles } = get()
    const newArticles: Record<string, ArticleCache> = {}
    for (const [key, cache] of Object.entries(articles)) {
      newArticles[key] = {
        items: cache.items.map((a) =>
          a.id === articleId ? { ...a, isRead: true } : a
        ),
        fetchedAt: cache.fetchedAt,
      }
    }
    set({ articles: newArticles })
    getStorage().set('news:articles', newArticles)
  },

  markAllRead: () => {
    const { articles } = get()
    const newArticles: Record<string, ArticleCache> = {}
    for (const [key, cache] of Object.entries(articles)) {
      newArticles[key] = {
        items: cache.items.map((a) => ({ ...a, isRead: true })),
        fetchedAt: cache.fetchedAt,
      }
    }
    set({ articles: newArticles })
    getStorage().set('news:articles', newArticles)
  },

  toggleBookmark: (articleId) => {
    const { bookmarks, articles } = get()
    const updated = bookmarks.includes(articleId)
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId]

    const newArticles: Record<string, ArticleCache> = {}
    for (const [key, cache] of Object.entries(articles)) {
      newArticles[key] = {
        items: cache.items.map((a) =>
          a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a
        ),
        fetchedAt: cache.fetchedAt,
      }
    }

    set({ bookmarks: updated, articles: newArticles })
    getStorage().set('news:bookmarks', updated)
    getStorage().set('news:articles', newArticles)
  },

  setActiveArticle: (article) => set({ activeArticle: article }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setViewMode: (mode) => {
    set({ viewMode: mode })
    getStorage().set('news:view', mode)
  },
  setShowBookmarksOnly: (show) => set({ showBookmarksOnly: show }),
  setShowUnreadOnly: (show) => set({ showUnreadOnly: show }),
  setSortBy: (sort) => set({ sortBy: sort }),

  setReaderSettings: (settings) => {
    set({ readerSettings: settings })
    getStorage().set('news:reader', settings)
  },

  getEnabledFeeds: () => {
    const { catalog, enabledFeedIds, customFeeds } = get()
    const catalogFeeds = catalog.filter((f) => enabledFeedIds.includes(f.id))
    return [...catalogFeeds, ...customFeeds]
  },

  getUnreadCount: () => {
    const { articles, enabledFeedIds, customFeeds } = get()
    const activeIds = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
    let count = 0
    for (const id of activeIds) {
      const cache = articles[id]
      if (cache) {
        for (const item of cache.items) {
          if (!item.isRead) count++
        }
      }
    }
    return count
  },

  cacheReaderContent: (id, html) => {
    const { readerCache } = get()
    set({ readerCache: { ...readerCache, [id]: html } })
  },

  getCachedReaderContent: (id) => {
    return get().readerCache[id] ?? null
  },

  setAutoRefreshInterval: (interval) => {
    set({ autoRefreshInterval: interval })
    getStorage().set('news:autoRefresh', interval)
  },

  setRetentionDays: (days) => {
    set({ retentionDays: days })
    getStorage().set('news:retention', days)
    get().cleanOldArticles()
  },

  cleanOldArticles: () => {
    const { articles, retentionDays, readerCache } = get()
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
    const newArticles: Record<string, ArticleCache> = {}
    let changed = false
    const keptIds = new Set<string>()
    for (const [key, cache] of Object.entries(articles)) {
      const filtered = cache.items.filter((a) => a.publishedAt > cutoff)
      if (filtered.length !== cache.items.length) changed = true
      for (const item of filtered) keptIds.add(item.id)
      newArticles[key] = { items: filtered, fetchedAt: cache.fetchedAt }
    }
    const newReaderCache: Record<string, string> = {}
    for (const [id, html] of Object.entries(readerCache)) {
      if (keptIds.has(id)) newReaderCache[id] = html
    }
    const cacheChanged = Object.keys(newReaderCache).length !== Object.keys(readerCache).length
    if (changed) {
      set({ articles: newArticles })
      getStorage().set('news:articles', newArticles)
    }
    if (cacheChanged) {
      set({ readerCache: newReaderCache })
    }
  },

  getRefreshIntervalMs: () => {
    return REFRESH_INTERVALS[get().autoRefreshInterval]
  },
}))

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const newsState: Record<string, unknown> = {}
  const feeds = storage.get<string[]>('news:feeds')
  if (feeds) newsState.enabledFeedIds = feeds
  const custom = storage.get<unknown[]>('news:custom')
  if (custom) newsState.customFeeds = custom
  const articles = storage.get<Record<string, unknown>>('news:articles')
  if (articles) newsState.articles = articles
  const bookmarks = storage.get<string[]>('news:bookmarks')
  if (bookmarks) newsState.bookmarks = bookmarks
  const reader = storage.get<unknown>('news:reader')
  if (reader) newsState.readerSettings = reader
  const view = storage.get<string>('news:view')
  if (view) newsState.viewMode = view
  if (Object.keys(newsState).length > 0) {
    useNewsStore.setState(newsState as never)
  }
})
