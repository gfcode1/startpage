import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Task } from './types'

const STORAGE_KEY = 'todo:tasks'

export function loadTasks(): Task[] {
  return getStorage().get<Task[]>(STORAGE_KEY) ?? []
}

export function saveTasks(tasks: Task[]): void {
  getStorage().set(STORAGE_KEY, tasks)
}

export function createTask(text: string): Task {
  return {
    id: generateId(),
    text: text.trim(),
    done: false,
    createdAt: Date.now(),
  }
}

export function toggleTask(id: string): Task[] {
  const tasks = loadTasks()
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  )
  saveTasks(updated)
  return updated
}
