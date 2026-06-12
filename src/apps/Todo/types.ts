export type Priority = 'low' | 'medium' | 'high'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: Priority
  tags: string[]
  parentId: string | null
  dueDate: number | null
  order: number
  createdAt: number
  completedAt: number | null
}

export type FilterMode = 'all' | 'active' | 'completed'
export type SortMode = 'manual' | 'dueDate' | 'priority' | 'createdAt'

export interface TagDef {
  name: string
  color: string
}

export interface TodoList {
  id: string
  name: string
  items: TodoItem[]
  tags: TagDef[]
  createdAt: number
  updatedAt: number
}

export interface TodoAppData {
  activeListId: string
  lists: TodoList[]
  listOrder: string[]
}
