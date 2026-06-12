import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNoteSearch } from '../hooks/useNoteSearch'
import type { Note } from '../types'

function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: Math.random().toString(36),
    title: '',
    content: '',
    folder: '',
    tags: [],
    pinned: false,
    archived: false,
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('useNoteSearch', () => {
  it('returns all active notes', () => {
    const notes = [createNote({ title: 'A' }), createNote({ title: 'B' })]
    const { result } = renderHook(() => useNoteSearch(notes, '', ''))
    expect(result.current.sortedNotes).toHaveLength(2)
  })

  it('excludes archived notes', () => {
    const notes = [
      createNote({ title: 'A' }),
      createNote({ title: 'B', archived: true }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, '', ''))
    expect(result.current.sortedNotes).toHaveLength(1)
  })

  it('excludes deleted notes', () => {
    const notes = [
      createNote({ title: 'A' }),
      createNote({ title: 'B', deletedAt: Date.now() }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, '', ''))
    expect(result.current.sortedNotes).toHaveLength(1)
  })

  it('filters by folder', () => {
    const notes = [
      createNote({ title: 'A', folder: 'work' }),
      createNote({ title: 'B', folder: 'personal' }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, '', 'work'))
    expect(result.current.sortedNotes).toHaveLength(1)
    expect(result.current.sortedNotes[0].title).toBe('A')
  })

  it('searches by title', () => {
    const notes = [
      createNote({ title: 'Meeting Notes' }),
      createNote({ title: 'Shopping List' }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, 'meeting', ''))
    expect(result.current.sortedNotes).toHaveLength(1)
    expect(result.current.sortedNotes[0].title).toBe('Meeting Notes')
  })

  it('searches by content', () => {
    const notes = [
      createNote({ title: 'A', content: 'important details here' }),
      createNote({ title: 'B', content: 'just random stuff' }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, 'important', ''))
    expect(result.current.sortedNotes).toHaveLength(1)
    expect(result.current.sortedNotes[0].title).toBe('A')
  })

  it('sorts pinned notes first', () => {
    const notes = [
      createNote({ title: 'A', pinned: false, updatedAt: 100 }),
      createNote({ title: 'B', pinned: true, updatedAt: 50 }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, '', ''))
    expect(result.current.sortedNotes[0].title).toBe('B')
    expect(result.current.sortedNotes[1].title).toBe('A')
  })

  it('sorts by updatedAt descending within same pin status', () => {
    const notes = [
      createNote({ title: 'A', updatedAt: 100 }),
      createNote({ title: 'B', updatedAt: 200 }),
      createNote({ title: 'C', updatedAt: 150 }),
    ]
    const { result } = renderHook(() => useNoteSearch(notes, '', ''))
    expect(result.current.sortedNotes.map(n => n.title)).toEqual(['B', 'C', 'A'])
  })
})
