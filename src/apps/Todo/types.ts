export type Priority = 'low' | 'medium' | 'high'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: Priority
  createdAt: number
  completedAt: number | null
}

export type FilterMode = 'all' | 'active' | 'completed'

export interface TodoList {
  name: string
  items: TodoItem[]
  createdAt: number
  updatedAt: number
}
