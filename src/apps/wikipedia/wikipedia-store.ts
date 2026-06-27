import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'
import type { Bookmark, ReadHistoryEntry, ViewMode } from './types'
import { STORAGE_KEYS } from './shared'
import { generateId } from '@/lib/utils/id'

interface WikipediaState {
  bookmarks: Bookmark[]
  history: ReadHistoryEntry[]
  query: string
  selectedId: number | null
  viewMode: ViewMode
}

interface WikipediaActions {
  addBookmark: (pageid: number, title: string, thumbnail?: string) => void
  removeBookmark: (pageid: number) => void
  isBookmarked: (pageid: number) => boolean
  addToHistory: (pageid: number, title: string) => void
  clearHistory: () => void
  setQuery: (query: string) => void
  selectArticle: (id: number) => void
  goBack: () => void
  setViewMode: (mode: ViewMode) => void
}

export type WikipediaStore = WikipediaState & WikipediaActions

function loadBookmarks(): Bookmark[] {
  return getStorage().get<Bookmark[]>(STORAGE_KEYS.bookmarks) ?? []
}

function saveBookmarks(bookmarks: Bookmark[]): void {
  getStorage().set(STORAGE_KEYS.bookmarks, bookmarks)
}

function loadHistory(): ReadHistoryEntry[] {
  return getStorage().get<ReadHistoryEntry[]>(STORAGE_KEYS.history) ?? []
}

function saveHistory(history: ReadHistoryEntry[]): void {
  getStorage().set(STORAGE_KEYS.history, history)
}

export const useWikipediaStore = create<WikipediaStore>()(
  subscribeWithSelector((set, get) => ({
    bookmarks: loadBookmarks(),
    history: loadHistory(),
    query: '',
    selectedId: null,
    viewMode: 'search' as ViewMode,

    addBookmark: (pageid, title, thumbnail) => {
      const { bookmarks } = get()
      if (bookmarks.some((b) => b.pageid === pageid)) return
      const bookmark: Bookmark = {
        id: generateId(),
        pageid,
        title,
        thumbnail,
        savedAt: Date.now(),
      }
      set({ bookmarks: [bookmark, ...bookmarks] })
    },

    removeBookmark: (pageid) => {
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.pageid !== pageid),
      }))
    },

    isBookmarked: (pageid) => {
      return get().bookmarks.some((b) => b.pageid === pageid)
    },

    addToHistory: (pageid, title) => {
      set((state) => {
        const filtered = state.history.filter((h) => h.pageid !== pageid)
        return {
          history: [{ pageid, title, readAt: Date.now() }, ...filtered].slice(0, 50),
        }
      })
    },

    clearHistory: () => set({ history: [] }),

    setQuery: (query) => set({ query }),

    selectArticle: (id) => {
      set({ selectedId: id, viewMode: 'article' })
    },

    goBack: () => {
      set({ selectedId: null, viewMode: 'search' })
    },

    setViewMode: (viewMode) => set({ viewMode }),
  })),
)

useWikipediaStore.subscribe((state) => {
  saveBookmarks(state.bookmarks)
  saveHistory(state.history)
})

export const useWikipediaBookmarks = () => useWikipediaStore((s) => s.bookmarks)
export const useWikipediaHistory = () => useWikipediaStore((s) => s.history)
export const useWikipediaQuery = () => useWikipediaStore((s) => s.query)
export const useWikipediaSelectedId = () => useWikipediaStore((s) => s.selectedId)
export const useWikipediaViewMode = () => useWikipediaStore((s) => s.viewMode)
export const useWikipediaAddBookmark = () => useWikipediaStore((s) => s.addBookmark)
export const useWikipediaRemoveBookmark = () => useWikipediaStore((s) => s.removeBookmark)
export const useWikipediaIsBookmarked = () => useWikipediaStore((s) => s.isBookmarked)
export const useWikipediaAddToHistory = () => useWikipediaStore((s) => s.addToHistory)
export const useWikipediaSetQuery = () => useWikipediaStore((s) => s.setQuery)
export const useWikipediaSelectArticle = () => useWikipediaStore((s) => s.selectArticle)
export const useWikipediaGoBack = () => useWikipediaStore((s) => s.goBack)
export const useWikipediaSetViewMode = () => useWikipediaStore((s) => s.setViewMode)

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const bookmarks = storage.get<Bookmark[]>(STORAGE_KEYS.bookmarks)
  if (bookmarks) useWikipediaStore.setState({ bookmarks })
  const history = storage.get<ReadHistoryEntry[]>(STORAGE_KEYS.history)
  if (history) useWikipediaStore.setState({ history })
})
