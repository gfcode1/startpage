export type HNCategory = 'top' | 'new' | 'show' | 'ask' | 'jobs' | 'best'

export interface HNStory {
  id: string
  title: string
  link: string
  commentsUrl: string
  score: number
  commentCount: number
  author: string
  pubDate: string
  pubDateParsed: number
  category: HNCategory
}

export interface HNCache {
  stories: HNStory[]
  category: HNCategory
  timestamp: number
}
