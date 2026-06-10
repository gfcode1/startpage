export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type FilterMode = 'all' | 'overdue' | 'completed'

export interface KanbanChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface KanbanCard {
  id: string
  title: string
  description: string
  columnId: string
  order: number
  priority: Priority
  tags: string[]
  dueDate: number | null
  assignee: string
  checklist: KanbanChecklistItem[]
  coverColor: string | null
  createdAt: number
  updatedAt: number
}

export interface KanbanColumn {
  id: string
  name: string
  color: string
  order: number
}

export interface KanbanBoard {
  id: string
  name: string
  columns: KanbanColumn[]
  createdAt: number
}

export interface TagDef {
  name: string
  color: string
}

export interface KanbanState {
  boards: KanbanBoard[]
  activeBoardId: string
  cards: Record<string, KanbanCard>
  tags: TagDef[]
  createdAt: number
  updatedAt: number
}
