import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Note, Folder, NotesData } from './types'

const STORAGE_KEY = 'notes:data'

export function loadNotesData(): NotesData {
  return getStorage().get<NotesData>(STORAGE_KEY) ?? { folders: [], notes: [], activeNoteId: null }
}

export function saveNotesData(data: NotesData): void {
  getStorage().set(STORAGE_KEY, data)
}

export function createNote(title: string, folderId: string | null = null): Note {
  const now = Date.now()
  return {
    id: generateId(),
    title: title.trim() || 'Untitled',
    folderId,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function addNote(title: string, folderId: string | null = null): Note {
  const data = loadNotesData()
  const note = createNote(title, folderId)
  data.notes.push(note)
  data.activeNoteId = note.id
  saveNotesData(data)
  return note
}

export function deleteNote(noteId: string): void {
  const data = loadNotesData()
  data.notes = data.notes.filter((n) => n.id !== noteId)
  if (data.activeNoteId === noteId) {
    data.activeNoteId = data.notes[0]?.id ?? null
  }
  saveNotesData(data)
}

export function updateNoteTitle(noteId: string, title: string): void {
  const data = loadNotesData()
  const note = data.notes.find((n) => n.id === noteId)
  if (note) {
    note.title = title
    note.updatedAt = Date.now()
    saveNotesData(data)
  }
}

export function updateNoteContent(noteId: string, content: string): void {
  const data = loadNotesData()
  const note = data.notes.find((n) => n.id === noteId)
  if (note) {
    note.content = content
    note.updatedAt = Date.now()
    saveNotesData(data)
  }
}

export function moveNoteToFolder(noteId: string, folderId: string | null): void {
  const data = loadNotesData()
  const note = data.notes.find((n) => n.id === noteId)
  if (note) {
    note.folderId = folderId
    note.updatedAt = Date.now()
    saveNotesData(data)
  }
}

export function createFolder(name: string): Folder {
  const now = Date.now()
  return {
    id: generateId(),
    name: name.trim() || 'New Folder',
    createdAt: now,
  }
}

export function addFolder(name: string): Folder {
  const data = loadNotesData()
  const folder = createFolder(name)
  data.folders.push(folder)
  saveNotesData(data)
  return folder
}

export function deleteFolder(folderId: string): void {
  const data = loadNotesData()
  data.folders = data.folders.filter((f) => f.id !== folderId)
  data.notes = data.notes.map((n) =>
    n.folderId === folderId ? { ...n, folderId: null } : n,
  )
  saveNotesData(data)
}

export function renameFolder(folderId: string, name: string): void {
  const data = loadNotesData()
  const folder = data.folders.find((f) => f.id === folderId)
  if (folder) {
    folder.name = name
    saveNotesData(data)
  }
}

export function getNotesByFolder(data: NotesData, folderId: string | null): Note[] {
  return data.notes.filter((n) => n.folderId === folderId)
}

export function getSortedNotes(data: NotesData): Note[] {
  return [...data.notes].sort((a, b) => b.updatedAt - a.updatedAt)
}
