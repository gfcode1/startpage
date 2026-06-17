import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { VaultEntry, Category, SortField, SortOrder, VaultStore } from './types'
import { loadData, saveData } from './utils'

const initialData = loadData()

export const useVaultStore = create<VaultStore>()(
  subscribeWithSelector((set) => ({
    ...initialData,
    searchQuery: '',
    filterCategoryId: null,
    sortField: 'updatedAt' as SortField,
    sortOrder: 'desc' as SortOrder,
    viewMode: 'list' as const,
    selectedEntryId: null,

    addEntry: (entry) => {
      set((state) => ({ entries: [entry, ...state.entries] }))
    },

    updateEntry: (id, partial) => {
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...partial, updatedAt: Date.now() } : e,
        ),
      }))
    },

    deleteEntry: (id) => {
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        selectedEntryId: state.selectedEntryId === id ? null : state.selectedEntryId,
      }))
    },

    toggleFavorite: (id) => {
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, favorite: !e.favorite, updatedAt: Date.now() } : e,
        ),
      }))
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setFilterCategoryId: (filterCategoryId) => set({ filterCategoryId }),

    setSort: (sortField, sortOrder) => {
      set((state) => ({
        sortField,
        sortOrder: sortOrder ?? (state.sortField === sortField && state.sortOrder === 'asc' ? 'desc' : 'asc'),
      }))
    },

    setViewMode: (viewMode) => set({ viewMode }),

    setSelectedEntryId: (selectedEntryId) => set({ selectedEntryId }),

    addCategory: (category) => {
      set((state) => ({ categories: [...state.categories, category] }))
    },

    renameCategory: (id, name) => {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, name: name.trim() || c.name } : c,
        ),
      }))
    },

    deleteCategory: (id) => {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        entries: state.entries.map((e) =>
          e.categoryId === id ? { ...e, categoryId: null } : e,
        ),
        filterCategoryId: state.filterCategoryId === id ? null : state.filterCategoryId,
      }))
    },
  })),
)

useVaultStore.subscribe((state) => {
  saveData({ entries: state.entries, categories: state.categories })
})

function compareEntries(a: VaultEntry, b: VaultEntry, field: SortField, order: SortOrder): number {
  const dir = order === 'asc' ? 1 : -1
  switch (field) {
    case 'name':
      return a.name.localeCompare(b.name) * dir
    case 'createdAt':
      return (a.createdAt - b.createdAt) * dir
    case 'updatedAt':
    default:
      return (a.updatedAt - b.updatedAt) * dir
  }
}

export function getFilteredEntries(
  entries: VaultEntry[],
  searchQuery: string,
  filterCategoryId: string | null,
  sortField: SortField,
  sortOrder: SortOrder,
): VaultEntry[] {
  let filtered = entries

  if (filterCategoryId) {
    filtered = filtered.filter((e) => e.categoryId === filterCategoryId)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q),
    )
  }

  return [...filtered].sort((a, b) => compareEntries(a, b, sortField, sortOrder))
}

export const useVaultEntries = () => useVaultStore((s) => s.entries)
export const useVaultCategories = () => useVaultStore((s) => s.categories)
export const useVaultSearchQuery = () => useVaultStore((s) => s.searchQuery)
export const useVaultFilterCategoryId = () => useVaultStore((s) => s.filterCategoryId)
export const useVaultSortField = () => useVaultStore((s) => s.sortField)
export const useVaultSortOrder = () => useVaultStore((s) => s.sortOrder)
export const useVaultViewMode = () => useVaultStore((s) => s.viewMode)
export const useVaultSelectedEntryId = () => useVaultStore((s) => s.selectedEntryId)

export const useVaultEntryById = (id: string | null) =>
  useVaultStore((s) => (id ? s.entries.find((e) => e.id === id) ?? null : null))

export const useVaultFilteredEntries = () =>
  useVaultStore(
    useShallow((s) => getFilteredEntries(s.entries, s.searchQuery, s.filterCategoryId, s.sortField, s.sortOrder)),
  )

export const useVaultRecentEntries = (limit = 5) =>
  useVaultStore(
    useShallow((s) =>
      [...s.entries]
        .sort((a, b) => {
          if (a.favorite && !b.favorite) return -1
          if (!a.favorite && b.favorite) return 1
          return b.updatedAt - a.updatedAt
        })
        .slice(0, limit),
    ),
  )

export const useVaultCategoryMap = () =>
  useVaultStore(
    useShallow((s) => {
      const map: Record<string, Category> = {}
      for (const c of s.categories) map[c.id] = c
      return map
    }),
  )

export const useVaultAddEntry = () => useVaultStore((s) => s.addEntry)
export const useVaultUpdateEntry = () => useVaultStore((s) => s.updateEntry)
export const useVaultDeleteEntry = () => useVaultStore((s) => s.deleteEntry)
export const useVaultToggleFavorite = () => useVaultStore((s) => s.toggleFavorite)
export const useVaultSetSearchQuery = () => useVaultStore((s) => s.setSearchQuery)
export const useVaultSetFilterCategoryId = () => useVaultStore((s) => s.setFilterCategoryId)
export const useVaultSetSort = () => useVaultStore((s) => s.setSort)
export const useVaultSetViewMode = () => useVaultStore((s) => s.setViewMode)
export const useVaultSetSelectedEntryId = () => useVaultStore((s) => s.setSelectedEntryId)
export const useVaultAddCategory = () => useVaultStore((s) => s.addCategory)
export const useVaultRenameCategory = () => useVaultStore((s) => s.renameCategory)
export const useVaultDeleteCategory = () => useVaultStore((s) => s.deleteCategory)

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const data = storage.get<{ entries: unknown[]; categories: unknown[] }>('vault:data')
  if (data) {
    useVaultStore.setState({
      entries: data.entries as never,
      categories: data.categories as never,
      searchQuery: '',
      filterCategoryId: null,
      sortField: 'updatedAt' as never,
      sortOrder: 'desc' as never,
      viewMode: 'list' as never,
      selectedEntryId: null,
    })
  }
})
