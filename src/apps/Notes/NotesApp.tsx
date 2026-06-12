import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { useTopbar } from '../../framework/TopbarContext'
import { generateId } from './utils'
import { useNotes } from './hooks/useNotes'
import { useNoteSearch } from './hooks/useNoteSearch'
import { NoteList } from './components/NoteList'
import { NoteEditor } from './components/NoteEditor'
import { FolderSidebar } from './components/FolderSidebar'
import { NoteToolbar } from './components/NoteToolbar'
import type { Note } from './types'
import './NotesApp.css'

const APP_ID = 'notes'
const LEGACY_APP_ID = 'markdownnotes'

function migrateFromLegacy() {
  try {
    const legacy = localStorage.getItem(`gf:${LEGACY_APP_ID}:notes`)
    if (legacy) {
      const current = localStorage.getItem(`gf:${APP_ID}:notes`)
      if (!current) {
        const parsed: Record<string, unknown>[] = JSON.parse(legacy)
        const migrated = parsed.map(n => ({
          ...n,
          tags: Array.isArray(n.tags) ? n.tags : [],
          pinned: typeof n.pinned === 'boolean' ? n.pinned : false,
          archived: typeof n.archived === 'boolean' ? n.archived : false,
          deletedAt: typeof n.deletedAt === 'number' ? n.deletedAt : null,
        }))
        localStorage.setItem(`gf:${APP_ID}:notes`, JSON.stringify(migrated))
      }
      localStorage.removeItem(`gf:${LEGACY_APP_ID}:notes`)
    }
  } catch { /* silent */ }
}

migrateFromLegacy()

export default function NotesApp() {
  const { notes, setNotes, folders, addNote, updateNote, deleteNote, setNoteFolder, togglePin } = useNotes()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [showFolderSidebar, setShowFolderSidebar] = useState(false)
  const { addToast } = useToast()
  const { setActions, setSearch: setTopbarSearch, clearConfig } = useTopbar()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editingNote = editingNoteId
    ? notes.find(n => n.id === editingNoteId) ?? null
    : null

  const { sortedNotes } = useNoteSearch(notes, search, selectedFolder)

  const handleSave = useCallback((id: string, title: string, content: string) => {
    if (id === editingNoteId) {
      updateNote(id, title, content)
    }
  }, [editingNoteId, updateNote])

  useEffect(() => {
    if (!editingNoteId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(editingNoteId, editorTitle, editorContent)
      setSaveStatus('saved')
    }, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [editorTitle, editorContent, editingNoteId, handleSave])

  const handleSelectNote = useCallback((note: Note) => {
    setEditingNoteId(note.id)
    setEditorTitle(note.title)
    setEditorContent(note.content)
    setMobileTab('edit')
  }, [])

  const handleNewNote = useCallback(() => {
    const note = addNote(selectedFolder)
    setEditingNoteId(note.id)
    setEditorTitle('')
    setEditorContent('')
    setMobileTab('edit')
    setSaveStatus('saved')
    addToast('New note created', 'success')
  }, [addNote, selectedFolder, addToast])

  useEffect(() => {
    setActions([
      { id: 'new-note', icon: 'plus', label: 'New Note', onClick: handleNewNote, variant: 'primary' },
    ])
    setTopbarSearch({ placeholder: 'Search notes...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, handleNewNote, setActions, setTopbarSearch, clearConfig])

  const handleBack = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (editingNoteId && editingNote) {
      const trimmedTitle = editorTitle.trim()
      const trimmedContent = editorContent.trim()
      if (!trimmedTitle && !trimmedContent) {
        setNotes(prev => prev.filter(n => n.id !== editingNoteId))
      } else if (trimmedTitle !== editingNote.title || trimmedContent !== editingNote.content) {
        updateNote(editingNoteId, trimmedTitle || 'Untitled', trimmedContent)
      }
    }
    setEditingNoteId(null)
    setEditorTitle('')
    setEditorContent('')
    setSaveStatus('idle')
  }, [editingNoteId, editingNote, editorTitle, editorContent, setNotes, updateNote])

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return
    deleteNote(deleteConfirmId)
    if (editingNoteId === deleteConfirmId) {
      setEditingNoteId(null)
      setEditorTitle('')
      setEditorContent('')
      setSaveStatus('idle')
    }
    addToast('Note deleted', 'error')
  }, [deleteConfirmId, editingNoteId, deleteNote, addToast])

  const handleTitleChange = useCallback((value: string) => {
    setEditorTitle(value)
    setSaveStatus('saving')
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    setSaveStatus('saving')
  }, [])

  const handleDuplicate = useCallback((note: Note) => {
    const dup: Note = {
      ...note,
      id: generateId(),
      title: note.title ? `${note.title} (copy)` : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [dup, ...prev])
    addToast('Note duplicated', 'success')
  }, [setNotes, addToast])

  const handleBackRef = useRef(handleBack)
  useEffect(() => { handleBackRef.current = handleBack }, [handleBack])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingNoteId) {
        handleBackRef.current()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
        return
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editingNoteId, handleNewNote])

  return (
    <>
      <div className="gf-notes">
        {editingNoteId ? (
          <NoteEditor
            note={editingNote}
            editorTitle={editorTitle}
            editorContent={editorContent}
            saveStatus={saveStatus}
            mobileTab={mobileTab}
            folders={folders}
            onBack={handleBack}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onMobileTabChange={setMobileTab}
            onFolderChange={setNoteFolder}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        ) : (
          <>
            <AppHeader
              badge={notes.length > 0 ? `${notes.length} note${notes.length !== 1 ? 's' : ''}` : undefined}
            />

            <NoteToolbar
              showFolderSidebar={showFolderSidebar}
              folderCount={folders.length}
              onToggleFolderSidebar={() => setShowFolderSidebar(prev => !prev)}
            />

            <div className={`gf-notes__layout ${showFolderSidebar ? 'gf-notes__layout--sidebar' : ''}`}>
              {showFolderSidebar && (
                <FolderSidebar
                  folders={folders}
                  activeCount={notes.filter(n => !n.archived && n.deletedAt === null).length}
                  getFolderCount={(folder: string) => notes.filter(n => n.folder === folder && !n.archived && n.deletedAt === null).length}
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                  onNewFolder={() => {
                    const name = prompt('Folder name:')
                    if (name?.trim()) setSelectedFolder(name.trim())
                  }}
                  onClose={() => setShowFolderSidebar(false)}
                />
              )}

              <div className="gf-notes__main">
                <NoteList
                  notes={sortedNotes}
                  search={search}
                  selectedFolder={selectedFolder}
                  onSelect={handleSelectNote}
                  onDelete={handleDelete}
                  onTogglePin={togglePin}
                  onNewNote={handleNewNote}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {deleteConfirmId && (
        <GfConfirmDialog
          open={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
          title="Delete note?"
          message="Are you sure you want to delete this note? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  )
}
