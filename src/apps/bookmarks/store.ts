import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Bookmark, Collection, SortField, SortOrder, BookmarkFilter, ViewMode, BookmarkStore } from './types'
import { loadData, saveData, createCollection, compareBookmarks, getChildCollectionIds } from './utils'

const initialData = loadData()

export const useBookmarkStore = create<BookmarkStore>()(
  subscribeWithSelector((set) => ({
    ...initialData,
    searchQuery: '',
    selectedCollectionId: null,
    sortField: 'updatedAt' as SortField,
    sortOrder: 'desc' as SortOrder,
    viewMode: 'grid' as ViewMode,
    filter: 'all' as BookmarkFilter,

    addCollection: (name, parentId = null) => {
      const col = createCollection(name, parentId, 0)
      set((state) => ({ collections: [...state.collections, col] }))
      return col
    },

    renameCollection: (id, name) => {
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === id ? { ...c, name: name.trim() || c.name } : c,
        ),
      }))
    },

    deleteCollection: (id) => {
      set((state) => {
        const idsToRemove = getChildCollectionIds(state.collections, id)
        return {
          collections: state.collections.filter((c) => !idsToRemove.includes(c.id)),
          bookmarks: state.bookmarks.map((b) =>
            idsToRemove.includes(b.collectionId ?? '') ? { ...b, collectionId: null } : b,
          ),
          selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
        }
      })
    },

    moveCollection: (id, parentId) => {
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === id ? { ...c, parentId } : c,
        ),
      }))
    },

    addBookmark: (bookmark) => {
      set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }))
    },

    updateBookmark: (id, partial) => {
      set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, ...partial, updatedAt: Date.now() } : b,
        ),
      }))
    },

    deleteBookmark: (id) => {
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      }))
    },

    toggleFavorite: (id) => {
      set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, isFavorite: !b.isFavorite, updatedAt: Date.now() } : b,
        ),
      }))
    },

    toggleReadLater: (id) => {
      set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, isReadLater: !b.isReadLater, updatedAt: Date.now() } : b,
        ),
      }))
    },

    moveBookmark: (id, collectionId) => {
      set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, collectionId, updatedAt: Date.now() } : b,
        ),
      }))
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setSelectedCollectionId: (selectedCollectionId) => set({ selectedCollectionId }),

    setSort: (sortField, sortOrder) => {
      set((state) => ({
        sortField,
        sortOrder: sortOrder ?? (state.sortField === sortField && state.sortOrder === 'asc' ? 'desc' : 'asc'),
      }))
    },

    setViewMode: (viewMode) => set({ viewMode }),

    setFilter: (filter) => set({ filter }),
  })),
)

useBookmarkStore.subscribe((state) => {
  saveData({ collections: state.collections, bookmarks: state.bookmarks })
})

const useBookmarkStoreSelector = useBookmarkStore

export const useBookmarks = () => useBookmarkStoreSelector((s) => s.bookmarks)
export const useCollections = () => useBookmarkStoreSelector((s) => s.collections)
export const useSearchQuery = () => useBookmarkStoreSelector((s) => s.searchQuery)
export const useSelectedCollectionId = () => useBookmarkStoreSelector((s) => s.selectedCollectionId)
export const useSortField = () => useBookmarkStoreSelector((s) => s.sortField)
export const useSortOrder = () => useBookmarkStoreSelector((s) => s.sortOrder)
export const useViewMode = () => useBookmarkStoreSelector((s) => s.viewMode)
export const useFilter = () => useBookmarkStoreSelector((s) => s.filter)

export function getFilteredBookmarks(
  bookmarks: Bookmark[],
  searchQuery: string,
  selectedCollectionId: string | null,
  collections: Collection[],
  filter: BookmarkFilter,
  sortField: SortField,
  sortOrder: SortOrder,
): Bookmark[] {
  let filtered = bookmarks

  if (selectedCollectionId) {
    const ids = getChildCollectionIds(collections, selectedCollectionId)
    filtered = filtered.filter((b) => b.collectionId && ids.includes(b.collectionId))
  }

  if (filter === 'favorites') {
    filtered = filtered.filter((b) => b.isFavorite)
  } else if (filter === 'readLater') {
    filtered = filtered.filter((b) => b.isReadLater)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  return [...filtered].sort((a, b) => compareBookmarks(a, b, sortField, sortOrder))
}

export const useFilteredBookmarks = () =>
  useBookmarkStoreSelector(
    useShallow((s) => getFilteredBookmarks(s.bookmarks, s.searchQuery, s.selectedCollectionId, s.collections, s.filter, s.sortField, s.sortOrder)),
  )

export const useCollectionBookmarkCount = (collectionId: string) =>
  useBookmarkStoreSelector((s) => {
    const ids = getChildCollectionIds(s.collections, collectionId)
    return s.bookmarks.filter((b) => b.collectionId && ids.includes(b.collectionId)).length
  })

export const useRecentBookmarks = (limit = 5) =>
  useBookmarkStoreSelector(
    useShallow((s) =>
      [...s.bookmarks]
        .sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1
          if (!a.isFavorite && b.isFavorite) return 1
          return b.updatedAt - a.updatedAt
        })
        .slice(0, limit),
    ),
  )

export const useBookmarkById = (id: string | null) =>
  useBookmarkStoreSelector((s) => (id ? s.bookmarks.find((b) => b.id === id) ?? null : null))

export const useCollectionMap = () =>
  useBookmarkStoreSelector(
    useShallow((s) => {
      const map: Record<string, Collection> = {}
      for (const c of s.collections) map[c.id] = c
      return map
    }),
  )

export const useAddCollection = () => useBookmarkStoreSelector((s) => s.addCollection)
export const useRenameCollection = () => useBookmarkStoreSelector((s) => s.renameCollection)
export const useDeleteCollection = () => useBookmarkStoreSelector((s) => s.deleteCollection)
export const useAddBookmark = () => useBookmarkStoreSelector((s) => s.addBookmark)
export const useUpdateBookmark = () => useBookmarkStoreSelector((s) => s.updateBookmark)
export const useDeleteBookmark = () => useBookmarkStoreSelector((s) => s.deleteBookmark)
export const useToggleFavorite = () => useBookmarkStoreSelector((s) => s.toggleFavorite)
export const useToggleReadLater = () => useBookmarkStoreSelector((s) => s.toggleReadLater)
export const useMoveBookmark = () => useBookmarkStoreSelector((s) => s.moveBookmark)
export const useSetSearchQuery = () => useBookmarkStoreSelector((s) => s.setSearchQuery)
export const useSetSelectedCollectionId = () => useBookmarkStoreSelector((s) => s.setSelectedCollectionId)
export const useSetSort = () => useBookmarkStoreSelector((s) => s.setSort)
export const useSetViewMode = () => useBookmarkStoreSelector((s) => s.setViewMode)
export const useSetFilter = () => useBookmarkStoreSelector((s) => s.setFilter)
