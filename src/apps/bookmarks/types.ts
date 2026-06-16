export interface Collection {
  id: string
  name: string
  parentId: string | null
  icon: string
  color: string
  order: number
  createdAt: number
}

export interface Bookmark {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  ogImage: string
  collectionId: string | null
  tags: string[]
  notes: string
  isReadLater: boolean
  isFavorite: boolean
  createdAt: number
  updatedAt: number
}

export type ViewMode = 'grid' | 'list'

export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'url'

export type SortOrder = 'asc' | 'desc'

export type BookmarkFilter = 'all' | 'favorites' | 'readLater'

export interface BookmarkState {
  collections: Collection[]
  bookmarks: Bookmark[]
  searchQuery: string
  selectedCollectionId: string | null
  sortField: SortField
  sortOrder: SortOrder
  viewMode: ViewMode
  filter: BookmarkFilter
}

export interface BookmarkActions {
  addCollection: (name: string, parentId?: string | null) => Collection
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  moveCollection: (id: string, parentId: string | null) => void
  addBookmark: (bookmark: Bookmark) => void
  updateBookmark: (id: string, partial: Partial<Bookmark>) => void
  deleteBookmark: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleReadLater: (id: string) => void
  moveBookmark: (id: string, collectionId: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedCollectionId: (id: string | null) => void
  setSort: (field: SortField, order?: SortOrder) => void
  setViewMode: (mode: ViewMode) => void
  setFilter: (filter: BookmarkFilter) => void
}

export type BookmarkStore = BookmarkState & BookmarkActions
