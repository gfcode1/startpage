import type { Note } from '../types'
import { GfIcon } from '../../../framework/iconSystem'
import { GfEmptyState } from '../../../framework/components/EmptyState'
import { NoteCard } from './NoteCard'

interface NoteListProps {
  notes: Note[]
  search: string
  selectedFolder: string
  onSelect: (note: Note) => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onTogglePin: (id: string) => void
  onNewNote: () => void
}

export function NoteList({ notes, search, selectedFolder, onSelect, onDelete, onTogglePin, onNewNote }: NoteListProps) {
  if (notes.length === 0 && search) {
    return (
      <GfEmptyState
        icon={<GfIcon name="search" size={24} />}
        title="No notes match your search"
        description="Try different keywords"
      />
    )
  }

  if (notes.length === 0 && !search && selectedFolder) {
    return (
      <GfEmptyState
        icon={<GfIcon name="folder" size={24} />}
        title={`No notes in "${selectedFolder}"`}
        description="Create a note in this folder to get started"
        action={{ label: 'Create note', onClick: onNewNote }}
      />
    )
  }

  if (notes.length === 0 && !search && !selectedFolder) {
    return (
      <GfEmptyState
        icon={<GfIcon name="document" size={24} />}
        title="No notes yet"
        description="Create your first note to get started"
        action={{ label: 'Create your first note', onClick: onNewNote }}
      />
    )
  }

  return (
    <div className="gf-notes__list">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          search={search}
          onSelect={onSelect}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  )
}
