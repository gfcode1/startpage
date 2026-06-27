import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Card, Column, Priority, Filter } from '@/apps/kanban/types'
import { loadBoard, saveBoard, createCard as makeCard, createColumn as makeColumn } from '@/apps/kanban/utils'

interface KanbanState {
  columns: Column[]
  searchQuery: string
  filter: Filter
}

interface KanbanActions {
  addColumn: (title: string) => void
  renameColumn: (id: string, title: string) => void
  deleteColumn: (id: string) => void
  moveColumn: (fromIndex: number, toIndex: number) => void
  addCard: (columnId: string, title: string, description?: string, priority?: Priority, labels?: string[], dueDate?: number | null, assignee?: string) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
  moveCard: (cardId: string, targetColumnId: string, targetIndex?: number) => void
  setSearchQuery: (query: string) => void
  setFilter: (filter: Filter) => void
}

type KanbanStore = KanbanState & KanbanActions

const initial = loadBoard()

export const useKanbanStore = create<KanbanStore>()(
  subscribeWithSelector((set) => ({
    columns: initial.columns,
    searchQuery: '',
    filter: 'all' as Filter,

    addColumn: (title) => {
      const col = makeColumn(title)
      set((state) => ({ columns: [...state.columns, col] }))
    },

    renameColumn: (id, title) => {
      set((state) => ({
        columns: state.columns.map((c) =>
          c.id === id ? { ...c, title: title.trim() || c.title } : c,
        ),
      }))
    },

    deleteColumn: (id) => {
      set((state) => ({
        columns: state.columns.filter((c) => c.id !== id),
      }))
    },

    moveColumn: (fromIndex, toIndex) => {
      set((state) => {
        const cols = [...state.columns]
        const [moved] = cols.splice(fromIndex, 1)
        cols.splice(toIndex, 0, moved!)
        return { columns: cols }
      })
    },

    addCard: (columnId, title, description, priority = 'medium', labels = [], dueDate = null, assignee = '') => {
      const card = makeCard(title, description, priority, labels, dueDate, assignee)
      set((state) => ({
        columns: state.columns.map((col) =>
          col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
        ),
      }))
    },

    updateCard: (cardId, updates) => {
      set((state) => ({
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c.id === cardId ? { ...c, ...updates, updatedAt: Date.now() } : c,
          ),
        })),
      }))
    },

    deleteCard: (cardId) => {
      set((state) => ({
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== cardId),
        })),
      }))
    },

    moveCard: (cardId, targetColumnId, targetIndex) => {
      set((state) => {
        let sourceColIdx = -1
        let card: Card | undefined

        for (let i = 0; i < state.columns.length; i++) {
          const found = state.columns[i]!.cards.find((c) => c.id === cardId)
          if (found) {
            card = found
            sourceColIdx = i
            break
          }
        }
        if (!card || sourceColIdx === -1) return state

        const targetColIdx = state.columns.findIndex((c) => c.id === targetColumnId)
        if (targetColIdx === -1) return state

        const newColumns = state.columns.map((col) => ({ ...col, cards: [...col.cards] }))
        newColumns[sourceColIdx]!.cards = newColumns[sourceColIdx]!.cards.filter((c) => c.id !== cardId)

        if (targetIndex === undefined || targetIndex < 0) {
          newColumns[targetColIdx]!.cards.push(card)
        } else {
          newColumns[targetColIdx]!.cards.splice(targetIndex, 0, card)
        }

        return { columns: newColumns }
      })
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setFilter: (filter) => set({ filter }),
  })),
)

useKanbanStore.subscribe((state) => {
  saveBoard({ columns: state.columns })
})

export function getKanbanColumns() {
  return useKanbanStore.getState().columns
}

// Atomic state selectors (stable — return primitives or same references)
export const useKanbanColumns = () => useKanbanStore((s) => s.columns)
export const useKanbanSearchQuery = () => useKanbanStore((s) => s.searchQuery)
export const useKanbanFilter = () => useKanbanStore((s) => s.filter)

export const useKanbanCardCount = () =>
  useKanbanStore((s) => s.columns.reduce((acc, col) => acc + col.cards.length, 0))

// Action hooks (stable — each returns the same function reference)
export const useKanbanAddColumn = () => useKanbanStore((s) => s.addColumn)
export const useKanbanRenameColumn = () => useKanbanStore((s) => s.renameColumn)
export const useKanbanDeleteColumn = () => useKanbanStore((s) => s.deleteColumn)
export const useKanbanMoveColumn = () => useKanbanStore((s) => s.moveColumn)
export const useKanbanAddCard = () => useKanbanStore((s) => s.addCard)
export const useKanbanUpdateCard = () => useKanbanStore((s) => s.updateCard)
export const useKanbanDeleteCard = () => useKanbanStore((s) => s.deleteCard)
export const useKanbanMoveCard = () => useKanbanStore((s) => s.moveCard)
export const useKanbanSetSearchQuery = () => useKanbanStore((s) => s.setSearchQuery)
export const useKanbanSetFilter = () => useKanbanStore((s) => s.setFilter)

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const data = storage.get<{ columns: unknown[] }>('kanban:data')
  if (data) {
    useKanbanStore.setState({
      columns: data.columns as never,
    })
  }
})
