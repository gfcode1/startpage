import { describe, it, expect, beforeEach } from 'vitest'
import { createTask, loadTasks, saveTasks } from './utils'

describe('Todo utils', () => {
  beforeEach(() => localStorage.clear())

  it('creates a task with correct shape', () => {
    const task = createTask('Buy milk')
    expect(task.id).toBeTruthy()
    expect(task.text).toBe('Buy milk')
    expect(task.done).toBe(false)
    expect(task.createdAt).toBeGreaterThan(0)
  })

  it('trims task text', () => {
    const task = createTask('  hello  ')
    expect(task.text).toBe('hello')
  })

  it('save and load tasks', () => {
    const task = createTask('Test')
    saveTasks([task])
    const loaded = loadTasks()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]!.text).toBe('Test')
  })

  it('returns empty array when no tasks saved', () => {
    const tasks = loadTasks()
    expect(tasks).toEqual([])
  })

  it('overwrites on save', () => {
    saveTasks([createTask('First')])
    saveTasks([createTask('Second')])
    const loaded = loadTasks()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]!.text).toBe('Second')
  })
})
