export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Filter = 'all' | Priority

export type SortBy = 'manual' | 'priority' | 'dueDate' | 'title' | 'createdAt'

export interface Card {
  id: string
  title: string
  description?: string
  priority: Priority
  labels: string[]
  dueDate: number | null
  assignee: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  title: string
  cards: Card[]
  sortBy: SortBy
  createdAt: number
}

export interface Board {
  id: string
  name: string
  columns: Column[]
  createdAt: number
  updatedAt: number
}

export interface KanbanData {
  boards: Board[]
  activeBoardId: string
}

export interface BoardSnapshot {
  boardId: string
  columns: Column[]
}
