export interface WikiPage {
  title: string
  pageid: number
  snippet: string
  extract?: string
  thumbnail?: { source: string }
  categories?: WikiCategory[]
  related?: WikiLink[]
}

export interface WikiCategory {
  title: string
}

export interface WikiLink {
  title: string
  pageid: number
}

export interface Bookmark {
  id: string
  pageid: number
  title: string
  thumbnail?: string
  savedAt: number
}

export interface ReadHistoryEntry {
  pageid: number
  title: string
  readAt: number
}

export type ViewMode = 'search' | 'article' | 'bookmarks'
