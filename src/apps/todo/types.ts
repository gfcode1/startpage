export type Priority = 'low' | 'medium' | 'high'

export type Filter = 'all' | 'active' | 'completed'

export type SortField = 'createdAt' | 'priority' | 'dueDate' | 'text'

export type SortOrder = 'asc' | 'desc'

export interface TodoList {
  id: string
  name: string
  createdAt: number
}

export interface Task {
  id: string
  listId: string
  text: string
  done: boolean
  priority: Priority
  category: string
  dueDate: number | null
  createdAt: number
}
