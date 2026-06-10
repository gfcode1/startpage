export interface SearchResult {
  id: number
  key: string
  title: string
  excerpt: string
  description: string
  thumbnail: { url: string; width: number; height: number } | null
}

export interface SearchResponse {
  pages: SearchResult[]
}

export interface ArticleSummary {
  type: string
  title: string
  displaytitle: string
  extract: string
  extract_html: string
  thumbnail: { source: string; width: number; height: number } | null
  originalimage: { source: string; width: number; height: number } | null
  description: string
  content_urls: {
    desktop: { page: string }
    mobile: { page: string }
  }
  pageid: number
  lang: string
}

export interface FeedNewsItem {
  story: string
  links: Array<{ title: string; url: string }>
}

export interface FeedOnThisDayEvent {
  text: string
  year: number
  pages: ArticleSummary[]
}

export interface FeedTfa extends ArticleSummary {
  tid: string
  timestamp: string
}

export interface FeedResponse {
  tfa: FeedTfa
  news: FeedNewsItem[]
  onthisday: FeedOnThisDayEvent[]
}
