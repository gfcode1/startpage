export interface FeedSource {
  id: string
  title: string
  url: string
  category: string
  country?: string
  language?: string
}

export interface NewsArticle {
  id: string
  feedId: string
  feedTitle: string
  title: string
  description: string
  content?: string
  link: string
  author?: string
  publishedAt: number
  imageUrl?: string
  isRead: boolean
  isBookmarked: boolean
  cachedAt: number
}

export interface ArticleCache {
  items: NewsArticle[]
  fetchedAt: number
}

export interface ReaderSettings {
  fontSize: 'sm' | 'md' | 'lg'
  fontFamily: 'sans' | 'serif' | 'mono'
  theme: 'light' | 'sepia' | 'dark'
}

export type ViewMode = 'grid' | 'list'
export type FeedView = 'all' | 'bookmarks'
export type SortBy = 'newest' | 'oldest' | 'unread-first'
export type AutoRefresh = 'off' | '15m' | '30m' | '1h'
export type RetentionDays = 7 | 30 | 90

export interface FeedStats {
  lastFetched: number
  errorCount: number
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 'md',
  fontFamily: 'sans',
  theme: 'light',
}
