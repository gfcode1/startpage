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

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 'md',
  fontFamily: 'sans',
  theme: 'light',
}
