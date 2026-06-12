import type { TodoItem, TodoList, TodoAppData, TagDef } from './types'

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

export function createList(name: string): TodoList {
  const now = Date.now()
  return {
    id: generateId(),
    name,
    items: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeItem(raw: unknown): TodoItem {
  const i = (raw || {}) as Record<string, unknown>
  return {
    id: typeof i.id === 'string' ? i.id : '',
    text: typeof i.text === 'string' ? i.text : '',
    completed: !!i.completed,
    priority: (i.priority === 'low' || i.priority === 'medium' || i.priority === 'high') ? i.priority : 'medium',
    tags: Array.isArray(i.tags) ? i.tags as string[] : [],
    parentId: typeof i.parentId === 'string' ? i.parentId : null,
    dueDate: typeof i.dueDate === 'number' ? i.dueDate : null,
    order: typeof i.order === 'number' ? i.order : 0,
    createdAt: typeof i.createdAt === 'number' ? i.createdAt : Date.now(),
    completedAt: typeof i.completedAt === 'number' ? i.completedAt : null,
  }
}

function normalizeList(raw: unknown): TodoList {
  const data = (raw || {}) as Record<string, unknown>
  return {
    id: typeof data.id === 'string' ? data.id : generateId(),
    name: typeof data.name === 'string' ? data.name : 'My List',
    items: Array.isArray(data.items) ? (data.items as TodoItem[]).map(normalizeItem) : [],
    tags: Array.isArray(data.tags) ? data.tags as TagDef[] : [],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  }
}

export function createInitialAppData(): TodoAppData {
  const list = createList('My List')
  return {
    activeListId: list.id,
    lists: [list],
    listOrder: [list.id],
  }
}

export function getActiveList(data: TodoAppData): TodoList | undefined {
  return data.lists.find(l => l.id === data.activeListId) || data.lists[0]
}

export function normalizeAppData(raw: unknown): TodoAppData {
  const d = (raw || {}) as Record<string, unknown>

  if (d.lists && Array.isArray(d.lists)) {
    return {
      activeListId: typeof d.activeListId === 'string' && d.lists.some((l: unknown) => (l as Record<string, unknown>).id === d.activeListId)
        ? d.activeListId
        : (Array.isArray(d.lists) && d.lists.length > 0 ? (d.lists[0] as Record<string, unknown>).id as string : ''),
      lists: (d.lists as TodoList[]).map(normalizeList),
      listOrder: Array.isArray(d.listOrder)
        ? d.listOrder.filter(id => (d.lists as TodoList[]).some((l: TodoList) => l.id === id))
        : (Array.isArray(d.lists) ? d.lists.map(l => l.id) : []),
    }
  }

  if (d.items !== undefined || d.name !== undefined) {
    const list = normalizeList(d)
    if (!d.id) list.id = generateId()
    return {
      activeListId: list.id,
      lists: [list],
      listOrder: [list.id],
    }
  }

  return createInitialAppData()
}

export function getSortedLists(data: TodoAppData): TodoList[] {
  return data.listOrder
    .map(id => data.lists.find(l => l.id === id))
    .filter((l): l is TodoList => l !== undefined)
}
