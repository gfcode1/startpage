export interface VaultEntry {
  id: string
  name: string
  url: string
  username: string
  password: string
  notes: string
  categoryId: string | null
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export type SortField = 'name' | 'createdAt' | 'updatedAt'

export type SortOrder = 'asc' | 'desc'

export interface VaultState {
  entries: VaultEntry[]
  categories: Category[]
  searchQuery: string
  filterCategoryId: string | null
  sortField: SortField
  sortOrder: SortOrder
  viewMode: 'list' | 'grid'
  selectedEntryId: string | null
}

export interface VaultActions {
  addEntry: (entry: VaultEntry) => void
  updateEntry: (id: string, partial: Partial<VaultEntry>) => void
  deleteEntry: (id: string) => void
  toggleFavorite: (id: string) => void
  setSearchQuery: (query: string) => void
  setFilterCategoryId: (id: string | null) => void
  setSort: (field: SortField, order?: SortOrder) => void
  setViewMode: (mode: 'list' | 'grid') => void
  setSelectedEntryId: (id: string | null) => void
  addCategory: (category: Category) => void
  renameCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void
}

export type VaultStore = VaultState & VaultActions
