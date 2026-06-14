import { describe, it, expect, beforeEach } from 'vitest'
import { createTask, loadData, saveData, createListData, DEFAULT_LIST_ID } from './utils'

describe('Todo utils', () => {
  beforeEach(() => localStorage.clear())

  describe('createTask', () => {
    it('creates a task with correct default shape', () => {
      const task = createTask('Buy milk')
      expect(task.id).toBeTruthy()
      expect(task.listId).toBe(DEFAULT_LIST_ID)
      expect(task.text).toBe('Buy milk')
      expect(task.done).toBe(false)
      expect(task.priority).toBe('medium')
      expect(task.category).toBe('')
      expect(task.dueDate).toBeNull()
      expect(task.createdAt).toBeGreaterThan(0)
    })

    it('creates a task with custom listId and priority', () => {
      const task = createTask('Urgent!', 'list-1', 'high', 'work', Date.now() + 86400000)
      expect(task.listId).toBe('list-1')
      expect(task.priority).toBe('high')
      expect(task.category).toBe('work')
      expect(task.dueDate).toBeGreaterThan(0)
    })

    it('trims task text', () => {
      const task = createTask('  hello  ')
      expect(task.text).toBe('hello')
    })
  })

  describe('createListData', () => {
    it('creates a list with trimmed name', () => {
      const list = createListData('  Work  ')
      expect(list.id).toBeTruthy()
      expect(list.name).toBe('Work')
      expect(list.createdAt).toBeGreaterThan(0)
    })

    it('uses default name for empty input', () => {
      const list = createListData('   ')
      expect(list.name).toBe('Untitled')
    })
  })

  describe('loadData with migration', () => {
    it('returns default data when no storage exists', () => {
      const data = loadData()
      expect(data.lists).toHaveLength(1)
      expect(data.lists[0]!.name).toBe('General')
      expect(data.tasks).toEqual([])
      expect(data.activeListId).toBe(DEFAULT_LIST_ID)
    })
  })

  describe('saveData and loadData roundtrip', () => {
    it('persists and loads lists and tasks', () => {
      const list = createListData('Work')
      const task = createTask('Do something', list.id, 'high')
      const data = { lists: [list], tasks: [task], activeListId: list.id }
      saveData(data)

      const loaded = loadData()
      expect(loaded.lists).toHaveLength(1)
      expect(loaded.lists[0]!.name).toBe('Work')
      expect(loaded.tasks).toHaveLength(1)
      expect(loaded.tasks[0]!.text).toBe('Do something')
      expect(loaded.activeListId).toBe(list.id)
    })
  })
})
