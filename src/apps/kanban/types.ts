export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Filter = 'all' | Priority

export interface Card {
  id: string
  title: string
  description?: string
  priority: Priority
  labels: string[]
  dueDate: number | null
  assignee: string
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  title: string
  cards: Card[]
  createdAt: number
}

export interface BoardData {
  columns: Column[]
}
