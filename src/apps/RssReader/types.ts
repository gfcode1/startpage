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
