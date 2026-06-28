import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Card, Column, Board, KanbanData, Priority, SortBy } from './types'

export const STORAGE_KEY = 'kanban:v2'
export const OLD_STORAGE_KEY = 'kanban:data'

const DEFAULT_COLUMNS: Omit<Column, 'id' | 'createdAt'>[] = [
  { title: 'Todo', cards: [], sortBy: 'manual' as SortBy },
  { title: 'In Progress', cards: [], sortBy: 'manual' as SortBy },
  { title: 'Done', cards: [], sortBy: 'manual' as SortBy },
]

function migrateCard(card: Record<string, unknown>): Card {
  return {
    id: String(card.id ?? generateId()),
    title: String(card.title ?? ''),
    description: card.description != null ? String(card.description) : undefined,
    priority: (card.priority as Priority) ?? 'medium',
    labels: Array.isArray(card.labels) ? card.labels.map(String) : [],
    dueDate: card.dueDate != null ? Number(card.dueDate) : null,
    assignee: card.assignee != null ? String(card.assignee) : '',
    archived: Boolean(card.archived),
    createdAt: card.createdAt != null ? Number(card.createdAt) : Date.now(),
    updatedAt: card.updatedAt != null ? Number(card.updatedAt) : Date.now(),
  }
}

function migrateColumn(col: Record<string, unknown>): Column {
  return {
    id: String(col.id ?? generateId()),
    title: String(col.title ?? 'Untitled'),
    cards: Array.isArray(col.cards) ? col.cards.map((c) => migrateCard(c as Record<string, unknown>)) : [],
    sortBy: (col.sortBy as SortBy) ?? 'manual',
    createdAt: col.createdAt != null ? Number(col.createdAt) : Date.now(),
  }
}

function makeDefaultColumns(): Column[] {
  return DEFAULT_COLUMNS.map((c) => ({ ...c, cards: [] as Card[], id: generateId(), createdAt: Date.now() }))
}

function migrateFromOldFormat(): KanbanData | null {
  const raw = getStorage().get<Record<string, unknown>>(OLD_STORAGE_KEY)
  if (!raw?.columns || !Array.isArray(raw.columns) || raw.columns.length === 0) return null

  const columns = (raw.columns as Array<Record<string, unknown>>).map((c) => migrateColumn(c))
  const board: Board = {
    id: generateId(),
    name: 'Default',
    columns,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  getStorage().remove(OLD_STORAGE_KEY)
  return { boards: [board], activeBoardId: board.id }
}

export function loadData(): KanbanData {
  const raw = getStorage().get<Record<string, unknown>>(STORAGE_KEY)
  if (raw?.boards && Array.isArray(raw.boards) && raw.boards.length > 0) {
    const boards = (raw.boards as Array<Record<string, unknown>>).map((b): Board => ({
      id: String(b.id ?? generateId()),
      name: String(b.name ?? 'Untitled'),
      columns: Array.isArray(b.columns) ? b.columns.map((c) => migrateColumn(c as Record<string, unknown>)) : makeDefaultColumns(),
      createdAt: b.createdAt != null ? Number(b.createdAt) : Date.now(),
      updatedAt: b.updatedAt != null ? Number(b.updatedAt) : Date.now(),
    }))
    const activeBoardId = typeof raw.activeBoardId === 'string' && boards.some((b) => b.id === raw.activeBoardId)
      ? raw.activeBoardId
      : boards[0]!.id
    return { boards, activeBoardId }
  }

  const migrated = migrateFromOldFormat()
  if (migrated) {
    saveData(migrated)
    return migrated
  }

  const board = createBoard('Default')
  const data: KanbanData = { boards: [board], activeBoardId: board.id }
  saveData(data)
  return data
}

export function saveData(data: KanbanData): void {
  getStorage().set(STORAGE_KEY, data)
}

export function createBoard(name: string): Board {
  const n = name.trim() || 'Untitled'
  return {
    id: generateId(),
    name: n,
    columns: makeDefaultColumns(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createCard(
  title: string,
  description = '',
  priority: Priority = 'medium',
  labels: string[] = [],
  dueDate: number | null = null,
  assignee = '',
): Card {
  return {
    id: generateId(),
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    labels,
    dueDate,
    assignee,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createColumn(title: string, sortBy: SortBy = 'manual'): Column {
  return {
    id: generateId(),
    title: title.trim() || 'Untitled',
    cards: [],
    sortBy,
    createdAt: Date.now(),
  }
}

export function snapshotBoard(board: Board): { boardId: string; columns: Column[] } {
  return { boardId: board.id, columns: JSON.parse(JSON.stringify(board.columns)) }
}

export function restoreBoardSnapshot(snapshot: { boardId: string; columns: Column[] }): Column[] {
  return JSON.parse(JSON.stringify(snapshot.columns))
}

export function getActiveBoard(data: KanbanData): Board | undefined {
  return data.boards.find((b) => b.id === data.activeBoardId)
}

export function sortCards(cards: Card[], sortBy: SortBy): Card[] {
  const sorted = [...cards]
  switch (sortBy) {
    case 'manual':
      return sorted
    case 'priority': {
      const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return sorted.sort((a, b) => order[a.priority] - order[b.priority])
    }
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (a.dueDate === null && b.dueDate === null) return 0
        if (a.dueDate === null) return 1
        if (b.dueDate === null) return -1
        return a.dueDate - b.dueDate
      })
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'createdAt':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    default:
      return sorted
  }
}
