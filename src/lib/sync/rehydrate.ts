import { getStorage } from '@/lib/storage/engine'
import { usePlayerStore } from '@/stores/player-store'
import { useWidgetStore } from '@/stores/widget-store'
import type { WidgetState } from '@/stores/widget-store'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'
import { useTodoStore } from '@/stores/todo-store'
import { useKanbanStore } from '@/stores/kanban-store'
import { useNewsStore } from '@/stores/news-store'
import { useBookmarkStore } from '@/apps/bookmarks/store'
import { useVaultStore } from '@/apps/password-vault/store'

export function rehydrateAllStores() {
  const storage = getStorage()

  const volume = storage.get<number>('player:volume')
  if (volume !== null) usePlayerStore.setState({ volume })

  const widgetConfig = storage.get<WidgetState>('widget:config')
  if (widgetConfig) useWidgetStore.setState(widgetConfig)

  const widgetOptions = storage.get<Record<string, Record<string, unknown>>>('widget:options')
  if (widgetOptions) useWidgetOptionsStore.setState({ options: widgetOptions })

  const todoData = storage.get<{ lists: unknown[]; tasks: unknown[]; activeListId: string }>('todo:data')
  if (todoData) {
    useTodoStore.setState({
      lists: todoData.lists as never,
      tasks: todoData.tasks as never,
      activeListId: todoData.activeListId,
      selectedIds: [],
      searchQuery: '',
      filter: 'all' as never,
    })
  }

  const kanbanData = storage.get<{ columns: unknown[] }>('kanban:data')
  if (kanbanData) {
    useKanbanStore.setState({
      columns: kanbanData.columns as never,
      searchQuery: '',
      filter: 'all' as never,
    })
  }

  const bookmarkData = storage.get<{ collections: unknown[]; bookmarks: unknown[] }>('bookmarks:data')
  if (bookmarkData) {
    useBookmarkStore.setState({
      collections: bookmarkData.collections as never,
      bookmarks: bookmarkData.bookmarks as never,
      searchQuery: '',
      selectedCollectionId: null,
      sortField: 'updatedAt' as never,
      sortOrder: 'desc' as never,
      viewMode: 'grid' as never,
      filter: 'all' as never,
    })
  }

  const vaultData = storage.get<{ entries: unknown[]; categories: unknown[] }>('vault:data')
  if (vaultData) {
    useVaultStore.setState({
      entries: vaultData.entries as never,
      categories: vaultData.categories as never,
      searchQuery: '',
      filterCategoryId: null,
      sortField: 'updatedAt' as never,
      sortOrder: 'desc' as never,
      viewMode: 'list' as never,
      selectedEntryId: null,
    })
  }

  const newsState: Record<string, unknown> = {}

  const feeds = storage.get<string[]>('news:feeds')
  if (feeds) newsState.enabledFeedIds = feeds

  const custom = storage.get<unknown[]>('news:custom')
  if (custom) newsState.customFeeds = custom

  const articles = storage.get<Record<string, unknown>>('news:articles')
  if (articles) newsState.articles = articles

  const bookmarks = storage.get<string[]>('news:bookmarks')
  if (bookmarks) newsState.bookmarks = bookmarks

  const reader = storage.get<unknown>('news:reader')
  if (reader) newsState.readerSettings = reader

  const view = storage.get<string>('news:view')
  if (view) newsState.viewMode = view

  if (Object.keys(newsState).length > 0) {
    useNewsStore.setState({ ...newsState, searchQuery: '' } as never)
  }
}
