import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Card, Column, BoardData, Priority } from './types'

export const STORAGE_KEY = 'kanban:data'
export const DEFAULT_COLUMNS: Column[] = [
  { id: generateId(), title: 'Todo', cards: [], createdAt: Date.now() },
  { id: generateId(), title: 'In Progress', cards: [], createdAt: Date.now() },
  { id: generateId(), title: 'Done', cards: [], createdAt: Date.now() },
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
    createdAt: card.createdAt != null ? Number(card.createdAt) : Date.now(),
    updatedAt: card.updatedAt != null ? Number(card.updatedAt) : Date.now(),
  }
}

function migrateColumn(col: Record<string, unknown>): Column {
  return {
    id: String(col.id ?? generateId()),
    title: String(col.title ?? 'Untitled'),
    cards: Array.isArray(col.cards) ? col.cards.map((c) => migrateCard(c as Record<string, unknown>)) : [],
    createdAt: col.createdAt != null ? Number(col.createdAt) : Date.now(),
  }
}

export function loadBoard(): BoardData {
  const raw = getStorage().get<Record<string, unknown>>(STORAGE_KEY)
  if (!raw) return { columns: DEFAULT_COLUMNS }
  const columns = Array.isArray(raw.columns)
    ? raw.columns.map((c) => migrateColumn(c as Record<string, unknown>))
    : DEFAULT_COLUMNS
  return { columns }
}

export function saveBoard(board: BoardData): void {
  getStorage().set(STORAGE_KEY, board)
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createColumn(title: string): Column {
  return {
    id: generateId(),
    title: title.trim() || 'Untitled',
    cards: [],
    createdAt: Date.now(),
  }
}
