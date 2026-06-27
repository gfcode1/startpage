import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Task, Filter, SortField, SortOrder, Priority, TodoList } from '@/apps/todo/types'
import { loadData, saveData, createTask as makeTask, createListData } from '@/apps/todo/utils'

interface TodoState {
  lists: TodoList[]
  tasks: Task[]
  activeListId: string
  filter: Filter
  searchQuery: string
  sortField: SortField
  sortOrder: SortOrder
  selectedIds: string[]
}

interface TodoActions {
  addTask: (text: string, priority?: Priority, category?: string, dueDate?: number | null) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, partial: Partial<Task>) => void
  setFilter: (filter: Filter) => void
  setSearchQuery: (query: string) => void
  setSort: (field: SortField, order?: SortOrder) => void
  toggleSelectTask: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  deleteSelected: () => void
  clearCompleted: () => void
  createList: (name: string) => void
  renameList: (id: string, name: string) => void
  deleteList: (id: string) => void
  setActiveList: (id: string) => void
}

type TodoStore = TodoState & TodoActions

const initialData = loadData()

export const useTodoStore = create<TodoStore>()(
  subscribeWithSelector((set) => ({
    ...initialData,
    filter: 'all' as Filter,
    searchQuery: '',
    sortField: 'createdAt' as SortField,
    sortOrder: 'desc' as SortOrder,
    selectedIds: [],

    addTask: (text, priority = 'medium', category = '', dueDate = null) => {
      const task = makeTask(text, '', priority, category, dueDate)
      if (!task.text) return
      set((state) => ({ tasks: [...state.tasks, { ...task, listId: state.activeListId }] }))
    },

    toggleTask: (id) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        ),
      }))
    },

    deleteTask: (id) => {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      }))
    },

    updateTask: (id, partial) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...partial } : t,
        ),
      }))
    },

    setFilter: (filter) => set({ filter }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setSort: (sortField, sortOrder) => {
      set((state) => ({
        sortField,
        sortOrder: sortOrder ?? (state.sortField === sortField && state.sortOrder === 'asc' ? 'desc' : 'asc'),
      }))
    },

    toggleSelectTask: (id) => {
      set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id],
      }))
    },

    selectAll: () => {
      set((state) => ({
        selectedIds: state.tasks
          .filter((t) => t.listId === state.activeListId)
          .map((t) => t.id),
      }))
    },

    clearSelection: () => set({ selectedIds: [] }),

    deleteSelected: () => {
      set((state) => {
        const ids = new Set(state.selectedIds)
        return {
          tasks: state.tasks.filter((t) => !ids.has(t.id)),
          selectedIds: [],
        }
      })
    },

    clearCompleted: () => {
      set((state) => ({
        tasks: state.tasks.filter((t) => !t.done),
        selectedIds: state.selectedIds.filter(
          (id) => !state.tasks.find((t) => t.id === id)?.done,
        ),
      }))
    },

    createList: (name) => {
      const list = createListData(name)
      set((state) => ({ lists: [...state.lists, list], activeListId: list.id, selectedIds: [] }))
    },

    renameList: (id, name) => {
      set((state) => ({
        lists: state.lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)),
      }))
    },

    deleteList: (id) => {
      set((state) => {
        if (state.lists.length <= 1) return state
        const remaining = state.lists.filter((l) => l.id !== id)
        const newActive = state.activeListId === id ? remaining[0]!.id : state.activeListId
        return {
          lists: remaining,
          tasks: state.tasks.filter((t) => t.listId !== id),
          activeListId: newActive,
          selectedIds: [],
        }
      })
    },

    setActiveList: (id) => {
      set({
        activeListId: id,
        selectedIds: [],
        searchQuery: '',
        filter: 'all' as Filter,
      })
    },
  })),
)

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function compareTasks(a: Task, b: Task, field: SortField, order: SortOrder): number {
  const dir = order === 'asc' ? 1 : -1
  switch (field) {
    case 'priority': {
      const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return diff * dir
    }
    case 'dueDate': {
      if (a.dueDate === null && b.dueDate === null) return 0
      if (a.dueDate === null) return 1 * dir
      if (b.dueDate === null) return -1 * dir
      return (a.dueDate - b.dueDate) * dir
    }
    case 'text': {
      return a.text.localeCompare(b.text) * dir
    }
    case 'createdAt':
    default: {
      return (a.createdAt - b.createdAt) * dir
    }
  }
}

export function getFilteredTasks(tasks: Task[], filter: Filter, searchQuery: string): Task[] {
  return tasks.filter((t) => {
    if (filter === 'active' && t.done) return false
    if (filter === 'completed' && !t.done) return false
    if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })
}

export function getSortedTasks(
  tasks: Task[],
  sortField: SortField,
  sortOrder: SortOrder,
): Task[] {
  return [...tasks].sort((a, b) => compareTasks(a, b, sortField, sortOrder))
}

// Persist on change
useTodoStore.subscribe((state) => {
  if (getIsRehydrating()) return
  saveData({ lists: state.lists, tasks: state.tasks, activeListId: state.activeListId })
})

// Atomic selectors
export const useTodoLists = () => useTodoStore((s) => s.lists)
export const useTodoTasks = () => useTodoStore((s) => s.tasks)
export const useTodoActiveListId = () => useTodoStore((s) => s.activeListId)
export const useTodoFilter = () => useTodoStore((s) => s.filter)
export const useTodoSearchQuery = () => useTodoStore((s) => s.searchQuery)
export const useTodoSortField = () => useTodoStore((s) => s.sortField)
export const useTodoSortOrder = () => useTodoStore((s) => s.sortOrder)
export const useTodoSelectedIds = () => useTodoStore((s) => s.selectedIds)

// Derived — primitives / stable refs
export const useTodoCurrentList = () =>
  useTodoStore((s) => s.lists.find((l) => l.id === s.activeListId) ?? s.lists[0])

export const useTodoCurrentTasks = () =>
  useTodoStore((s) => s.tasks.filter((t) => t.listId === s.activeListId))

export const useTodoPendingCount = () =>
  useTodoStore((s) => s.tasks.filter((t) => !t.done && t.listId === s.activeListId).length)

export const useTodoSelectedCount = () =>
  useTodoStore((s) => s.selectedIds.length)

export const useTodoCompletedCount = () =>
  useTodoStore((s) => s.tasks.filter((t) => t.done && t.listId === s.activeListId).length)

export const useTodoListMeta = (listId: string) =>
  useTodoStore((s) => s.lists.find((l) => l.id === listId))

export const useTodoListPendingCount = (listId: string) =>
  useTodoStore((s) => s.tasks.filter((t) => t.listId === listId && !t.done).length)

// Action hooks
export const useTodoAddTask = () => useTodoStore((s) => s.addTask)
export const useTodoToggleTask = () => useTodoStore((s) => s.toggleTask)
export const useTodoDeleteTask = () => useTodoStore((s) => s.deleteTask)
export const useTodoUpdateTask = () => useTodoStore((s) => s.updateTask)
export const useTodoSetFilter = () => useTodoStore((s) => s.setFilter)
export const useTodoSetSearchQuery = () => useTodoStore((s) => s.setSearchQuery)
export const useTodoSetSort = () => useTodoStore((s) => s.setSort)
export const useTodoToggleSelectTask = () => useTodoStore((s) => s.toggleSelectTask)
export const useTodoSelectAll = () => useTodoStore((s) => s.selectAll)
export const useTodoClearSelection = () => useTodoStore((s) => s.clearSelection)
export const useTodoDeleteSelected = () => useTodoStore((s) => s.deleteSelected)
export const useTodoClearCompleted = () => useTodoStore((s) => s.clearCompleted)
export const useTodoCreateList = () => useTodoStore((s) => s.createList)
export const useTodoRenameList = () => useTodoStore((s) => s.renameList)
export const useTodoDeleteList = () => useTodoStore((s) => s.deleteList)
export const useTodoSetActiveList = () => useTodoStore((s) => s.setActiveList)

// Rehydration
import { getIsRehydrating, registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const data = storage.get<{ lists: unknown[]; tasks: unknown[]; activeListId: string }>('todo:data')
  if (data) {
    useTodoStore.setState({
      lists: data.lists as never,
      tasks: data.tasks as never,
      activeListId: data.activeListId,
    })
  }
})
