import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotes } from '../hooks/useNotes'

beforeEach(() => {
  localStorage.clear()
})

describe('useNotes', () => {
  it('starts with empty notes', () => {
    const { result } = renderHook(() => useNotes())
    expect(result.current.notes).toEqual([])
    expect(result.current.folders).toEqual([])
  })

  it('adds a note', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      result.current.addNote('')
    })
    expect(result.current.notes).toHaveLength(1)
    expect(result.current.notes[0].title).toBe('')
    expect(result.current.notes[0].pinned).toBe(false)
  })

  it('adds a note with folder', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      result.current.addNote('work')
    })
    expect(result.current.notes[0].folder).toBe('work')
    expect(result.current.folders).toContain('work')
  })

  it('adds a note and returns it', () => {
    const { result } = renderHook(() => useNotes())
    let noteId = ''
    act(() => {
      const note = result.current.addNote('')
      noteId = note.id
    })
    expect(noteId).toBeTruthy()
    expect(result.current.notes[0].id).toBe(noteId)
  })

  it('updates a note', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      const note = result.current.addNote('')
      result.current.updateNote(note.id, 'Updated', 'Content')
    })
    expect(result.current.notes[0].title).toBe('Updated')
    expect(result.current.notes[0].content).toBe('Content')
  })

  it('deletes a note', () => {
    const { result } = renderHook(() => useNotes())
    let noteId = ''
    act(() => {
      const note = result.current.addNote('')
      noteId = note.id
      result.current.addNote('')
    })
    expect(result.current.notes).toHaveLength(2)
    act(() => {
      result.current.deleteNote(noteId)
    })
    expect(result.current.notes).toHaveLength(1)
  })

  it('sets note folder', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      const note = result.current.addNote('')
      result.current.setNoteFolder(note.id, 'personal')
    })
    expect(result.current.notes[0].folder).toBe('personal')
    expect(result.current.folders).toContain('personal')
  })

  it('toggles pin', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      const note = result.current.addNote('')
      result.current.togglePin(note.id)
    })
    expect(result.current.notes[0].pinned).toBe(true)
    act(() => {
      result.current.togglePin(result.current.notes[0].id)
    })
    expect(result.current.notes[0].pinned).toBe(false)
  })

  it('archives a note', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      const note = result.current.addNote('')
      result.current.archiveNote(note.id)
    })
    expect(result.current.notes[0].archived).toBe(true)
  })

  it('restores a note', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      const note = result.current.addNote('')
      result.current.archiveNote(note.id)
    })
    expect(result.current.notes[0].archived).toBe(true)
    act(() => {
      result.current.restoreNote(result.current.notes[0].id)
    })
    expect(result.current.notes[0].archived).toBe(false)
  })

  it('activeNotes excludes archived', () => {
    const { result } = renderHook(() => useNotes())
    act(() => {
      result.current.addNote('')
      const n2 = result.current.addNote('')
      result.current.archiveNote(n2.id)
    })
    expect(result.current.activeNotes).toHaveLength(1)
    expect(result.current.notes).toHaveLength(2)
    expect(result.current.activeNotes[0].archived).toBe(false)
  })
})
