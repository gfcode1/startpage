export interface Note {
  id: string
  title: string
  folderId: string | null
  content: string
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
  createdAt: number
}

export interface NotesData {
  folders: Folder[]
  notes: Note[]
  activeNoteId: string | null
}


