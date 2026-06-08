export interface Article {
  id: string
  feedTitle: string
  feedUrl: string
  title: string
  link: string
  description: string
  pubDate: string
  pubDateParsed: number
  mediaThumbnail?: string
  cachedContent?: string
  cachedAt?: number
}

export interface FeedInfo {
  title: string
  description: string
  link: string
  url: string
}

export interface FeedResult {
  feed: FeedInfo
  articles: Article[]
  error?: string
}

export interface DrawerContent {
  title: string
  content: string
  excerpt: string
  byline: string | null
}

export interface FeedConfig {
  url: string
  category: string
  title?: string
}
