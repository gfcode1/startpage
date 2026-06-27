import { create } from 'zustand'
import { getStorage } from '@/lib/storage/engine'
import type { FeedSource, NewsArticle, ArticleCache, ReaderSettings, ViewMode } from '@/apps/news/types'
import { DEFAULT_READER_SETTINGS } from '@/apps/news/types'
import { fetchAndParseFeed, uniqueByLink, MAX_ARTICLES_PER_FEED, getFeedTitleFromUrl } from '@/apps/news/utils'
import { generateId } from '@/lib/utils/id'
import catalogData from '@/apps/news/news-catalog.json'

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
  readerSettings: ReaderSettings
  isRefreshing: boolean
  feedErrors: string[]

  init: () => void
  toggleFeed: (feedId: string) => void
  addCustomFeed: (url: string) => Promise<void>
  removeFeed: (feedId: string) => void
  refreshAllFeeds: () => Promise<void>
  refreshFeed: (feed: FeedSource) => Promise<NewsArticle[]>
  markAsRead: (articleId: string) => void
  toggleBookmark: (articleId: string) => void
  setActiveArticle: (article: NewsArticle | null) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (cat: string | null) => void
  setSelectedCountry: (country: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setShowBookmarksOnly: (show: boolean) => void
  setReaderSettings: (settings: ReaderSettings) => void
  getEnabledFeeds: () => FeedSource[]
  getDisplayArticles: () => NewsArticle[]
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
  readerSettings: DEFAULT_READER_SETTINGS,
  isRefreshing: false,
  feedErrors: [],

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
  },

  toggleFeed: (feedId) => {
    const { enabledFeedIds } = get()
    const updated = enabledFeedIds.includes(feedId)
      ? enabledFeedIds.filter((id) => id !== feedId)
      : [...enabledFeedIds, feedId]
    set({ enabledFeedIds: updated })
    getStorage().set('news:feeds', updated)
    get().refreshFeed(get().getEnabledFeeds().find((f) => f.id === feedId)!)
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

    set({ isRefreshing: true, feedErrors: [] })

    const errors: string[] = []
    const batchSize = 4
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize)
      const results = await Promise.allSettled(batch.map((f) => get().refreshFeed(f)))
      results.forEach((r, j) => {
        if (r.status === 'rejected') {
          const feed = batch[j]
          if (feed) errors.push(feed.title)
        }
      })
      if (i + batchSize < feeds.length) {
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    set({ isRefreshing: false, feedErrors: errors })
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

      set({ articles: newArticles })
      getStorage().set('news:articles', newArticles)

      return articles
    } catch {
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

  setReaderSettings: (settings) => {
    set({ readerSettings: settings })
    getStorage().set('news:reader', settings)
  },

  getEnabledFeeds: () => {
    const { catalog, enabledFeedIds, customFeeds } = get()
    const catalogFeeds = catalog.filter((f) => enabledFeedIds.includes(f.id))
    return [...catalogFeeds, ...customFeeds]
  },

  getDisplayArticles: () => {
    const { articles, enabledFeedIds, customFeeds, searchQuery, selectedCategory, selectedCountry, showBookmarksOnly, bookmarks } = get()

    const activeIds = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
    const all: NewsArticle[] = []

    for (const id of activeIds) {
      const cache = articles[id]
      if (cache) all.push(...cache.items)
    }

    let filtered = all.sort((a, b) => b.publishedAt - a.publishedAt)

    if (showBookmarksOnly) {
      filtered = filtered.filter((a) => bookmarks.includes(a.id))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.feedTitle.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      const { catalog } = get()
      const catFeedIds = catalog
        .filter((f) => f.category === selectedCategory)
        .map((f) => f.id)
      filtered = filtered.filter((a) => catFeedIds.includes(a.feedId))
    }

    if (selectedCountry) {
      const { catalog } = get()
      const countryFeedIds = catalog
        .filter((f) => f.country === selectedCountry)
        .map((f) => f.id)
      filtered = filtered.filter((a) => countryFeedIds.includes(a.feedId))
    }

    return filtered
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
