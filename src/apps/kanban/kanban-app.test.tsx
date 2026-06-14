import { describe, it, expect, beforeEach } from 'vitest'
import { createCard, createColumn, loadBoard, saveBoard } from './utils'

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
      expect(col.createdAt).toBeGreaterThan(0)
    })

    it('uses default name for empty input', () => {
      const col = createColumn('   ')
      expect(col.title).toBe('Untitled')
    })
  })

  describe('loadBoard', () => {
    it('returns default board when no storage exists', () => {
      const board = loadBoard()
      expect(board.columns).toHaveLength(3)
      expect(board.columns[0]!.title).toBe('Todo')
      expect(board.columns[1]!.title).toBe('In Progress')
      expect(board.columns[2]!.title).toBe('Done')
      expect(board.columns[0]!.cards).toEqual([])
    })
  })

  describe('saveBoard and loadBoard roundtrip', () => {
    it('persists and loads board data', () => {
      const col1 = createColumn('Backlog')
      const card = createCard('Something', '', 'high')
      col1.cards.push(card)
      const board = { columns: [col1] }
      saveBoard(board)

      const loaded = loadBoard()
      expect(loaded.columns).toHaveLength(1)
      expect(loaded.columns[0]!.title).toBe('Backlog')
      expect(loaded.columns[0]!.cards).toHaveLength(1)
      expect(loaded.columns[0]!.cards[0]!.title).toBe('Something')
      expect(loaded.columns[0]!.cards[0]!.priority).toBe('high')
    })
  })
})
