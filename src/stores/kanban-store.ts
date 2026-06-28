import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Card, Column, Board, Priority, Filter, BoardSnapshot } from '@/apps/kanban/types'
import {
  loadData, saveData, STORAGE_KEY, OLD_STORAGE_KEY,
  createCard as makeCard, createColumn as makeColumn, createBoard as makeBoard,
  snapshotBoard, restoreBoardSnapshot,
} from '@/apps/kanban/utils'
import { generateId } from '@/lib/utils/id'
import { getIsRehydrating, registerRehydrator } from '@/lib/sync/rehydrate'

const MAX_UNDO = 50

function pushUndo(stack: BoardSnapshot[], snapshot: BoardSnapshot): BoardSnapshot[] {
  const next = [...stack, snapshot]
  return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next
}

interface KanbanState {
  boards: Board[]
  activeBoardId: string
  searchQuery: string
  filter: Filter
  undoStack: BoardSnapshot[]
  redoStack: BoardSnapshot[]
}

interface KanbanActions {
  addBoard: (name: string) => string
  renameBoard: (boardId: string, name: string) => void
  deleteBoard: (boardId: string) => void
  setActiveBoard: (boardId: string) => void
  addColumn: (title: string) => void
  renameColumn: (id: string, title: string) => void
  deleteColumn: (id: string) => void
  setColumnSort: (columnId: string, sortBy: Column['sortBy']) => void
  moveColumn: (fromIndex: number, toIndex: number) => void
  addCard: (columnId: string, title: string, description?: string, priority?: Priority, labels?: string[], dueDate?: number | null, assignee?: string) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
  duplicateCard: (cardId: string) => void
  archiveCard: (cardId: string) => void
  restoreCard: (cardId: string) => void
  moveCard: (cardId: string, targetColumnId: string, targetIndex?: number) => void
  setSearchQuery: (query: string) => void
  setFilter: (filter: Filter) => void
  undo: () => void
  redo: () => void
}

type KanbanStore = KanbanState & KanbanActions

const initial = loadData()

export const useKanbanStore = create<KanbanStore>()(
  subscribeWithSelector((set) => ({
    boards: initial.boards,
    activeBoardId: initial.activeBoardId,
    searchQuery: '',
    filter: 'all' as Filter,
    undoStack: [] as BoardSnapshot[],
    redoStack: [] as BoardSnapshot[],

    addBoard: (name) => {
      const board = makeBoard(name)
      set((state) => ({
        boards: [...state.boards, board],
        activeBoardId: board.id,
      }))
      return board.id
    },

    renameBoard: (boardId, name) => {
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === boardId ? { ...b, name: name.trim() || b.name, updatedAt: Date.now() } : b,
        ),
      }))
    },

    deleteBoard: (boardId) => {
      set((state) => {
        if (state.boards.length <= 1) return state
        const idx = state.boards.findIndex((b) => b.id === boardId)
        const newBoards = state.boards.filter((b) => b.id !== boardId)
        const newActiveId = state.activeBoardId === boardId
          ? newBoards[Math.min(idx, newBoards.length - 1)]!.id
          : state.activeBoardId
        return {
          boards: newBoards,
          activeBoardId: newActiveId,
          undoStack: state.undoStack.filter((s) => s.boardId !== boardId),
          redoStack: state.redoStack.filter((s) => s.boardId !== boardId),
        }
      })
    },

    setActiveBoard: (boardId) => set({ activeBoardId: boardId }),

    addColumn: (title) => {
      const col = makeColumn(title)
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: [...board.columns, col],
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    renameColumn: (id, title) => {
      set((state) => ({
        boards: updateActiveBoard(state, (board) => ({
          ...board,
          columns: board.columns.map((c) =>
            c.id === id ? { ...c, title: title.trim() || c.title } : c,
          ),
          updatedAt: Date.now(),
        })),
      }))
    },

    deleteColumn: (id) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.filter((c) => c.id !== id),
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    setColumnSort: (columnId, sortBy) => {
      set((state) => ({
        boards: updateActiveBoard(state, (board) => ({
          ...board,
          columns: board.columns.map((c) =>
            c.id === columnId ? { ...c, sortBy } : c,
          ),
          updatedAt: Date.now(),
        })),
      }))
    },

    moveColumn: (fromIndex, toIndex) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        const board = getActiveBoard(state)
        if (!board) return state
        const cols = [...board.columns]
        const [moved] = cols.splice(fromIndex, 1)
        cols.splice(toIndex, 0, moved!)
        return {
          boards: state.boards.map((b) =>
            b.id === board.id ? { ...b, columns: cols, updatedAt: Date.now() } : b,
          ),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    addCard: (columnId, title, description, priority = 'medium', labels = [], dueDate = null, assignee = '') => {
      const card = makeCard(title, description, priority, labels, dueDate, assignee)
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
            ),
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    updateCard: (cardId, updates) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              cards: col.cards.map((c) =>
                c.id === cardId ? { ...c, ...updates, updatedAt: Date.now() } : c,
              ),
            })),
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    deleteCard: (cardId) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              cards: col.cards.filter((c) => c.id !== cardId),
            })),
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    duplicateCard: (cardId) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        const board = getActiveBoard(state)
        if (!board) return state
        let foundCol: Column | undefined
        let foundCard: Card | undefined
        let cardIdx = -1
        for (const col of board.columns) {
          const idx = col.cards.findIndex((c) => c.id === cardId)
          if (idx !== -1) {
            foundCol = col
            foundCard = col.cards[idx]
            cardIdx = idx
            break
          }
        }
        if (!foundCol || !foundCard) return state
        const dup: Card = {
          ...foundCard,
          id: generateId(),
          title: `${foundCard.title} (copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        const newCards = [...foundCol.cards]
        newCards.splice(cardIdx + 1, 0, dup)
        return {
          boards: state.boards.map((b) =>
            b.id === board.id ? {
              ...b,
              columns: b.columns.map((col) =>
                col.id === foundCol!.id ? { ...col, cards: newCards } : col,
              ),
              updatedAt: Date.now(),
            } : b,
          ),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    archiveCard: (cardId) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        return {
          boards: updateActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              cards: col.cards.map((c) =>
                c.id === cardId ? { ...c, archived: true, updatedAt: Date.now() } : c,
              ),
            })),
            updatedAt: Date.now(),
          })),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    restoreCard: (cardId) => {
      set((state) => ({
        boards: updateActiveBoard(state, (board) => ({
          ...board,
          columns: board.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === cardId ? { ...c, archived: false, updatedAt: Date.now() } : c,
            ),
          })),
          updatedAt: Date.now(),
        })),
      }))
    },

    moveCard: (cardId, targetColumnId, targetIndex) => {
      set((state) => {
        const snapshot = getBoardSnapshot(state)
        const board = getActiveBoard(state)
        if (!board) return state

        let sourceColIdx = -1
        let card: Card | undefined
        for (let i = 0; i < board.columns.length; i++) {
          const found = board.columns[i]!.cards.find((c) => c.id === cardId)
          if (found) { card = found; sourceColIdx = i; break }
        }
        if (!card || sourceColIdx === -1) return state

        const targetColIdx = board.columns.findIndex((c) => c.id === targetColumnId)
        if (targetColIdx === -1) return state

        const newColumns = board.columns.map((col) => ({ ...col, cards: [...col.cards] }))
        newColumns[sourceColIdx]!.cards = newColumns[sourceColIdx]!.cards.filter((c) => c.id !== cardId)

        if (targetIndex === undefined || targetIndex < 0) {
          newColumns[targetColIdx]!.cards.push(card)
        } else {
          newColumns[targetColIdx]!.cards.splice(targetIndex, 0, card)
        }

        return {
          boards: state.boards.map((b) =>
            b.id === board.id ? { ...b, columns: newColumns, updatedAt: Date.now() } : b,
          ),
          undoStack: pushUndo(state.undoStack, snapshot),
          redoStack: [],
        }
      })
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setFilter: (filter) => set({ filter }),

    undo: () => {
      set((state) => {
        if (state.undoStack.length === 0) return state
        const snapshot = state.undoStack[state.undoStack.length - 1]!
        if (snapshot.boardId !== state.activeBoardId) return state
        const prevSnapshot = getBoardSnapshot(state)
        return {
          boards: setActiveBoardColumns(state, restoreBoardSnapshot(snapshot)),
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, prevSnapshot],
        }
      })
    },

    redo: () => {
      set((state) => {
        if (state.redoStack.length === 0) return state
        const snapshot = state.redoStack[state.redoStack.length - 1]!
        if (snapshot.boardId !== state.activeBoardId) return state
        const prevSnapshot = getBoardSnapshot(state)
        return {
          boards: setActiveBoardColumns(state, restoreBoardSnapshot(snapshot)),
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, prevSnapshot],
        }
      })
    },
  })),
)

useKanbanStore.subscribe((state) => {
  if (getIsRehydrating()) return
  saveData({ boards: state.boards, activeBoardId: state.activeBoardId })
})

function getActiveBoard(state: KanbanState): Board | undefined {
  return state.boards.find((b) => b.id === state.activeBoardId)
}

function updateActiveBoard(state: KanbanState, fn: (b: Board) => Board): Board[] {
  return state.boards.map((b) => (b.id === state.activeBoardId ? fn(b) : b))
}

function setActiveBoardColumns(state: KanbanState, columns: Column[]): Board[] {
  return state.boards.map((b) =>
    b.id === state.activeBoardId ? { ...b, columns, updatedAt: Date.now() } : b,
  )
}

function getBoardSnapshot(state: KanbanState): BoardSnapshot {
  const board = getActiveBoard(state)
  return board ? snapshotBoard(board) : { boardId: '', columns: [] }
}

export function getKanbanColumns() {
  const state = useKanbanStore.getState()
  return getActiveBoard(state)?.columns ?? []
}

function getKanbanBoard(state: KanbanState): Board | undefined {
  return state.boards.find((b) => b.id === state.activeBoardId)
}

// Atomic state selectors
export const useKanbanBoards = () => useKanbanStore((s) => s.boards)
export const useActiveBoardId = () => useKanbanStore((s) => s.activeBoardId)
export const useKanbanColumns = () => useKanbanStore((s) => getActiveBoard(s)?.columns ?? [])
export const useKanbanBoardName = () => useKanbanStore((s) => getActiveBoard(s)?.name ?? '')
export const useKanbanSearchQuery = () => useKanbanStore((s) => s.searchQuery)
export const useKanbanFilter = () => useKanbanStore((s) => s.filter)
export const useKanbanUndoCount = () => useKanbanStore((s) => s.undoStack.length)
export const useKanbanRedoCount = () => useKanbanStore((s) => s.redoStack.length)

export const useKanbanCardCount = () =>
  useKanbanStore((s) => {
    const board = getKanbanBoard(s)
    return board ? board.columns.reduce((acc, col) => acc + col.cards.filter((c) => !c.archived).length, 0) : 0
  })

// Action hooks
export const useKanbanAddBoard = () => useKanbanStore((s) => s.addBoard)
export const useKanbanRenameBoard = () => useKanbanStore((s) => s.renameBoard)
export const useKanbanDeleteBoard = () => useKanbanStore((s) => s.deleteBoard)
export const useKanbanSetActiveBoard = () => useKanbanStore((s) => s.setActiveBoard)
export const useKanbanAddColumn = () => useKanbanStore((s) => s.addColumn)
export const useKanbanRenameColumn = () => useKanbanStore((s) => s.renameColumn)
export const useKanbanDeleteColumn = () => useKanbanStore((s) => s.deleteColumn)
export const useKanbanSetColumnSort = () => useKanbanStore((s) => s.setColumnSort)
export const useKanbanMoveColumn = () => useKanbanStore((s) => s.moveColumn)
export const useKanbanAddCard = () => useKanbanStore((s) => s.addCard)
export const useKanbanUpdateCard = () => useKanbanStore((s) => s.updateCard)
export const useKanbanDeleteCard = () => useKanbanStore((s) => s.deleteCard)
export const useKanbanDuplicateCard = () => useKanbanStore((s) => s.duplicateCard)
export const useKanbanArchiveCard = () => useKanbanStore((s) => s.archiveCard)
export const useKanbanRestoreCard = () => useKanbanStore((s) => s.restoreCard)
export const useKanbanMoveCard = () => useKanbanStore((s) => s.moveCard)
export const useKanbanSetSearchQuery = () => useKanbanStore((s) => s.setSearchQuery)
export const useKanbanSetFilter = () => useKanbanStore((s) => s.setFilter)
export const useKanbanUndo = () => useKanbanStore((s) => s.undo)
export const useKanbanRedo = () => useKanbanStore((s) => s.redo)

// Rehydration
registerRehydrator((storage) => {
  const data = storage.get<Record<string, unknown>>(STORAGE_KEY)
  const oldData = storage.get<Record<string, unknown>>(OLD_STORAGE_KEY)
  if (data?.boards) {
    useKanbanStore.setState({
      boards: data.boards as never,
      activeBoardId: data.activeBoardId as string ?? (data.boards as Array<{ id: string }>)[0]?.id ?? '',
      undoStack: [],
      redoStack: [],
    })
  } else if (oldData?.columns) {
    const board: Board = {
      id: generateId(),
      name: 'Default',
      columns: oldData.columns as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    storage.set(STORAGE_KEY, { boards: [board], activeBoardId: board.id })
    storage.remove(OLD_STORAGE_KEY)
    useKanbanStore.setState({ boards: [board], activeBoardId: board.id, undoStack: [], redoStack: [] })
  }
})
