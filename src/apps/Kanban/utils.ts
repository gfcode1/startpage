import type { KanbanBoard, KanbanCard, KanbanState, Priority, TagDef } from './types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDueDate(ts: number): string {
  const now = new Date()
  const due = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return due.toLocaleDateString(undefined, { weekday: 'short' })
  return due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function isOverdue(dueDate: number): boolean {
  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return dueDay.getTime() < today.getTime()
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export const COVER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#a855f7']

export const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export function createDefaultBoard(): KanbanBoard {
  return {
    id: generateId(),
    name: 'My Board',
    columns: [
      { id: generateId(), name: 'To Do', color: '#3b82f6', order: 0 },
      { id: generateId(), name: 'In Progress', color: '#f97316', order: 1 },
      { id: generateId(), name: 'Review', color: '#8b5cf6', order: 2 },
      { id: generateId(), name: 'Done', color: '#22c55e', order: 3 },
    ],
    createdAt: Date.now(),
  }
}

export function normalizeCard(raw: unknown): KanbanCard {
  const i = (raw || {}) as Record<string, unknown>
  return {
    id: typeof i.id === 'string' ? i.id : '',
    title: typeof i.title === 'string' ? i.title : '',
    description: typeof i.description === 'string' ? i.description : '',
    columnId: typeof i.columnId === 'string' ? i.columnId : '',
    order: typeof i.order === 'number' ? i.order : 0,
    priority: (i.priority === 'low' || i.priority === 'medium' || i.priority === 'high' || i.priority === 'critical') ? i.priority as Priority : 'medium',
    tags: Array.isArray(i.tags) ? i.tags as string[] : [],
    dueDate: typeof i.dueDate === 'number' ? i.dueDate : null,
    assignee: typeof i.assignee === 'string' ? i.assignee : '',
    checklist: Array.isArray(i.checklist) ? (i.checklist as { id: string; text: string; completed: boolean }[]).map(c => ({
      id: typeof c.id === 'string' ? c.id : '',
      text: typeof c.text === 'string' ? c.text : '',
      completed: !!c.completed,
    })) : [],
    coverColor: typeof i.coverColor === 'string' ? i.coverColor : null,
    createdAt: typeof i.createdAt === 'number' ? i.createdAt : Date.now(),
    updatedAt: typeof i.updatedAt === 'number' ? i.updatedAt : Date.now(),
  }
}

export function normalizeBoard(raw: unknown): KanbanBoard {
  const b = (raw || {}) as Record<string, unknown>
  return {
    id: typeof b.id === 'string' ? b.id : '',
    name: typeof b.name === 'string' ? b.name : 'Unnamed Board',
    columns: Array.isArray(b.columns) ? (b.columns as KanbanBoard['columns']) : [],
    createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
  }
}

export function normalizeState(raw: unknown): KanbanState {
  const data = (raw || {}) as Record<string, unknown>
  const boards = Array.isArray(data.boards) ? (data.boards as KanbanBoard[]).map(normalizeBoard) : []
  const activeBoardId = typeof data.activeBoardId === 'string' ? data.activeBoardId : (boards[0]?.id || '')

  const rawCards = (data.cards || {}) as Record<string, unknown>
  const cards: Record<string, KanbanCard> = {}
  for (const key of Object.keys(rawCards)) {
    cards[key] = normalizeCard(rawCards[key])
  }

  return {
    boards,
    activeBoardId,
    cards,
    tags: Array.isArray(data.tags) ? data.tags as TagDef[] : [],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  }
}

export function createInitialState(): KanbanState {
  const board = createDefaultBoard()
  return {
    boards: [board],
    activeBoardId: board.id,
    cards: {},
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
