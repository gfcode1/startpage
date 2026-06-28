import { describe, it, expect, beforeEach } from 'vitest'
import { createCard, createColumn, createBoard, loadData, saveData, sortCards, snapshotBoard, restoreBoardSnapshot } from './utils'

describe('Kanban utils', () => {
  beforeEach(() => localStorage.clear())

  describe('createCard', () => {
    it('creates a card with correct default shape', () => {
      const card = createCard('Test card')
      expect(card.id).toBeTruthy()
      expect(card.title).toBe('Test card')
      expect(card.description).toBeUndefined()
      expect(card.priority).toBe('medium')
      expect(card.labels).toEqual([])
      expect(card.dueDate).toBeNull()
      expect(card.assignee).toBe('')
      expect(card.archived).toBe(false)
      expect(card.createdAt).toBeGreaterThan(0)
      expect(card.updatedAt).toBeGreaterThan(0)
    })

    it('creates a card with custom fields', () => {
      const card = createCard('Urgent!', 'Fix this now', 'critical', ['bug', 'urgent'], Date.now() + 86400000, 'Alice')
      expect(card.title).toBe('Urgent!')
      expect(card.description).toBe('Fix this now')
      expect(card.priority).toBe('critical')
      expect(card.labels).toEqual(['bug', 'urgent'])
      expect(card.dueDate).toBeGreaterThan(0)
      expect(card.assignee).toBe('Alice')
    })

    it('trims card title and description', () => {
      const card = createCard('  hello  ', '  world  ')
      expect(card.title).toBe('hello')
      expect(card.description).toBe('world')
    })

    it('keeps description undefined when empty', () => {
      const card = createCard('Test', '')
      expect(card.description).toBeUndefined()
    })
  })

  describe('createColumn', () => {
    it('creates a column with trimmed name', () => {
      const col = createColumn('  In Progress  ')
      expect(col.id).toBeTruthy()
      expect(col.title).toBe('In Progress')
      expect(col.cards).toEqual([])
      expect(col.sortBy).toBe('manual')
      expect(col.createdAt).toBeGreaterThan(0)
    })

    it('uses default name for empty input', () => {
      const col = createColumn('   ')
      expect(col.title).toBe('Untitled')
    })
  })

  describe('createBoard', () => {
    it('creates a board with default columns', () => {
      const board = createBoard('My Project')
      expect(board.id).toBeTruthy()
      expect(board.name).toBe('My Project')
      expect(board.columns).toHaveLength(3)
      expect(board.columns[0]!.title).toBe('Todo')
      expect(board.columns[1]!.title).toBe('In Progress')
      expect(board.columns[2]!.title).toBe('Done')
    })
  })

  describe('loadData', () => {
    it('returns default data when no storage exists', () => {
      const data = loadData()
      expect(data.boards).toHaveLength(1)
      expect(data.boards[0]!.name).toBe('Default')
      expect(data.boards[0]!.columns).toHaveLength(3)
    })
  })

  describe('saveData and loadData roundtrip', () => {
    it('persists and loads multi-board data', () => {
      const board = createBoard('Project Alpha')
      const col = board.columns[0]!
      col.cards.push(createCard('Do something', '', 'high'))
      const data = { boards: [board], activeBoardId: board.id }
      saveData(data)

      const loaded = loadData()
      expect(loaded.boards).toHaveLength(1)
      expect(loaded.boards[0]!.name).toBe('Project Alpha')
      expect(loaded.boards[0]!.columns[0]!.cards[0]!.title).toBe('Do something')
    })
  })

  describe('sortCards', () => {
    it('keeps manual order', () => {
      const cards = [
        createCard('B', '', 'low'),
        createCard('A', '', 'critical'),
      ]
      const sorted = sortCards(cards, 'manual')
      expect(sorted[0]!.title).toBe('B')
      expect(sorted[1]!.title).toBe('A')
    })

    it('sorts by priority', () => {
      const cards = [
        createCard('A', '', 'low'),
        createCard('B', '', 'critical'),
        createCard('C', '', 'high'),
      ]
      const sorted = sortCards(cards, 'priority')
      expect(sorted[0]!.priority).toBe('critical')
      expect(sorted[1]!.priority).toBe('high')
      expect(sorted[2]!.priority).toBe('low')
    })

    it('sorts by title', () => {
      const cards = [
        createCard('C'),
        createCard('A'),
        createCard('B'),
      ]
      const sorted = sortCards(cards, 'title')
      expect(sorted.map((c) => c.title)).toEqual(['A', 'B', 'C'])
    })
  })

  describe('snapshot and restore', () => {
    it('roundtrips board columns', () => {
      const board = createBoard('Test')
      board.columns[0]!.cards.push(createCard('Task 1'))
      const snap = snapshotBoard(board)
      board.columns[0]!.cards.push(createCard('Task 2'))
      const restored = restoreBoardSnapshot(snap)
      expect(restored[0]!.cards).toHaveLength(1)
      expect(restored[0]!.cards[0]!.title).toBe('Task 1')
    })
  })
})
