import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Task, Priority, TodoList } from './types'

const DATA_KEY = 'todo:data'

interface PersistedData {
  lists: TodoList[]
  tasks: Task[]
  activeListId: string
}

export const DEFAULT_LIST_ID = 'default'

function createDefaultList(): TodoList {
  return { id: DEFAULT_LIST_ID, name: 'General', createdAt: Date.now() }
}

function migrateLegacyData(): PersistedData | null {
  const storage = getStorage()
  const oldTasks = storage.get<Task[]>('todo:tasks')
  if (!oldTasks) return null

  const defaultList = createDefaultList()
  return {
    lists: [defaultList],
    tasks: oldTasks.map((t) => {
      const raw = t as unknown as Record<string, unknown>
      return {
        ...t,
        priority: raw.priority !== undefined ? raw.priority as Priority : 'medium',
        category: raw.category !== undefined ? String(raw.category) : '',
        dueDate: raw.dueDate !== undefined ? raw.dueDate as number | null : null,
        listId: DEFAULT_LIST_ID,
      }
    }),
    activeListId: DEFAULT_LIST_ID,
  }
}

export function loadData(): PersistedData {
  const storage = getStorage()

  const legacy = migrateLegacyData()
  if (legacy) {
    storage.remove('todo:tasks')
    storage.remove('todo:config')
    saveData(legacy)
    return legacy
  }

  const data = storage.get<PersistedData>(DATA_KEY)
  if (data?.lists?.length && data?.tasks) {
    return data
  }

  const defaultList = createDefaultList()
  return { lists: [defaultList], tasks: [], activeListId: DEFAULT_LIST_ID }
}

export function saveData(data: PersistedData): void {
  getStorage().set(DATA_KEY, data)
}

export function createTask(
  text: string,
  listId: string = DEFAULT_LIST_ID,
  priority: Priority = 'medium',
  category = '',
  dueDate: number | null = null,
): Task {
  return {
    id: generateId(),
    listId,
    text: text.trim(),
    done: false,
    priority,
    category,
    dueDate,
    createdAt: Date.now(),
  }
}

export function createListData(name: string): TodoList {
  return {
    id: generateId(),
    name: name.trim() || 'Untitled',
    createdAt: Date.now(),
  }
}
