import { useMemo } from 'react'
import type { Note } from '../types'

export function useNoteSearch(notes: Note[], search: string, selectedFolder: string) {
  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => !n.archived && n.deletedAt === null)
    if (selectedFolder) {
      result = result.filter(n => n.folder === selectedFolder)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, search, selectedFolder])

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [filteredNotes])

  return { filteredNotes, sortedNotes }
}
