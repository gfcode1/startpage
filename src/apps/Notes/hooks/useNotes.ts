import { useMemo, useCallback } from 'react'
import { useAppStorage } from '../../../framework/persistence/useAppStorage'
import { generateId } from '../utils'
import type { Note } from '../types'

const APP_ID = 'notes'

export function useNotes() {
  const [notes, setNotes] = useAppStorage<Note[]>(APP_ID, 'notes', [])

  const folders = useMemo(() => {
    const set = new Set(notes.map(n => n.folder).filter(Boolean))
    return Array.from(set).sort()
  }, [notes])

  const addNote = useCallback((folder: string) => {
    const note: Note = {
      id: generateId(),
      title: '',
      content: '',
      folder,
      tags: [],
      pinned: false,
      archived: false,
      deletedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [note, ...prev])
    return note
  }, [setNotes])

  const updateNote = useCallback((id: string, title: string, content: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n
    ))
  }, [setNotes])

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }, [setNotes])

  const setNoteFolder = useCallback((noteId: string, folder: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, folder } : n
    ))
  }, [setNotes])

  const togglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
    ))
  }, [setNotes])

  const archiveNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, archived: true, updatedAt: Date.now() } : n
    ))
  }, [setNotes])

  const restoreNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, archived: false, deletedAt: null, updatedAt: Date.now() } : n
    ))
  }, [setNotes])

  const activeNotes = useMemo(() => {
    return notes.filter(n => !n.archived && n.deletedAt === null)
  }, [notes])

  return {
    notes,
    setNotes,
    activeNotes,
    folders,
    addNote,
    updateNote,
    deleteNote,
    setNoteFolder,
    togglePin,
    archiveNote,
    restoreNote,
  }
}
