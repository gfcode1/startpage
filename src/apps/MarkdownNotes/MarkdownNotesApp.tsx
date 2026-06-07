import { useState, useMemo, useCallback, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { renderMarkdown, generateId, formatDate, getPreview } from './utils'
import type { Note } from './types'
import './MarkdownNotesApp.css'

const APP_ID = 'markdownnotes'

export default function MarkdownNotesApp() {
  const [notes, setNotes] = useAppStorage<Note[]>(APP_ID, 'notes', [])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')
  const { addToast } = useToast()

  const editingNote = editingNoteId
    ? notes.find(n => n.id === editingNoteId) ?? null
    : null

  const filteredNotes = useMemo(() => {
    if (!search) return notes
    const q = search.toLowerCase()
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  }, [notes, search])

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [filteredNotes])

  const previewHtml = useMemo(() => {
    return renderMarkdown(editorContent)
  }, [editorContent])

  const updateNote = useCallback((id: string, title: string, content: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n
    ))
  }, [setNotes])

  const handleSelectNote = useCallback((note: Note) => {
    setEditingNoteId(note.id)
    setEditorTitle(note.title)
    setEditorContent(note.content)
    setMobileTab('edit')
  }, [])

  const handleNewNote = useCallback(() => {
    const note: Note = {
      id: generateId(),
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [note, ...prev])
    setEditingNoteId(note.id)
    setEditorTitle('')
    setEditorContent('')
    setMobileTab('edit')
    addToast('New note created', 'success')
  }, [setNotes, addToast])

  const handleBack = useCallback(() => {
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
  }, [editingNoteId, editingNote, editorTitle, editorContent, setNotes, updateNote])

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editingNoteId === id) {
      setEditingNoteId(null)
    }
    addToast('Note deleted', 'error')
  }, [setNotes, editingNoteId, addToast])

  const handleTitleChange = useCallback((value: string) => {
    setEditorTitle(value)
    if (editingNoteId) {
      updateNote(editingNoteId, value, editorContent)
    }
  }, [editingNoteId, editorContent, updateNote])

  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    if (editingNoteId) {
      updateNote(editingNoteId, editorTitle, value)
    }
  }, [editingNoteId, editorTitle, updateNote])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingNoteId) {
        handleBack()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editingNoteId, handleBack])

  if (editingNoteId) {
    return (
      <div className="gf-markdown-notes">
        <div className="gf-markdown-notes__editor">
          <div className="gf-markdown-notes__editor-header">
            <button
              className="gf-markdown-notes__editor-back"
              onClick={handleBack}
              aria-label="Back to notes"
            >
              <GfIcon name="chevron-left" size={18} />
            </button>
            <input
              className="gf-markdown-notes__editor-title-input"
              type="text"
              value={editorTitle}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              autoFocus={!editingNote?.title}
            />
            <div className="gf-markdown-notes__editor-actions">
              <span className="gf-markdown-notes__editor-save-status">Auto-saved</span>
              <button
                className="gf-markdown-notes__btn gf-markdown-notes__btn--icon gf-markdown-notes__btn--danger"
                onClick={e => handleDelete(e, editingNoteId)}
                aria-label="Delete note"
                title="Delete note"
              >
                <GfIcon name="trash" size={15} />
              </button>
            </div>
          </div>

          <div className="gf-markdown-notes__editor-mobile-tabs">
            <button
              className={`gf-markdown-notes__editor-mobile-tab ${mobileTab === 'edit' ? 'gf-markdown-notes__editor-mobile-tab--active' : ''}`}
              onClick={() => setMobileTab('edit')}
            >
              Edit
            </button>
            <button
              className={`gf-markdown-notes__editor-mobile-tab ${mobileTab === 'preview' ? 'gf-markdown-notes__editor-mobile-tab--active' : ''}`}
              onClick={() => setMobileTab('preview')}
            >
              Preview
            </button>
          </div>

          <div className="gf-markdown-notes__editor-body">
            <textarea
              className={`gf-markdown-notes__editor-textarea ${mobileTab === 'preview' ? 'gf-markdown-notes__editor-textarea--hidden' : ''}`}
              value={editorContent}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Write your notes in Markdown...&#10;&#10;# Heading&#10;Paragraph with **bold**, *italic*, `code`.&#10;&#10;- List item&#10;- Another item&#10;&#10;> Blockquote"
              spellCheck={false}
            />
            <div
              className={`gf-markdown-notes__editor-preview ${mobileTab === 'edit' ? 'gf-markdown-notes__editor-preview--hidden' : ''}`}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-markdown-notes">
      <AppHeader
        title="Markdown Notes"
        badge={notes.length > 0 ? `${notes.length} note${notes.length !== 1 ? 's' : ''}` : undefined}
        searchPlaceholder="Search notes..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="gf-markdown-notes__toolbar">
        <button
          className="gf-markdown-notes__btn gf-markdown-notes__btn--primary"
          onClick={handleNewNote}
        >
          <GfIcon name="plus" size={14} />
          New Note
        </button>
      </div>

      {sortedNotes.length === 0 && (
        <div className="gf-markdown-notes__empty">
          <GfIcon name="document" size={48} />
          {search ? (
            <p>No notes match your search</p>
          ) : (
            <>
              <p>No notes yet</p>
              <button className="gf-markdown-notes__btn gf-markdown-notes__btn--primary" onClick={handleNewNote}>
                Create your first note
              </button>
            </>
          )}
        </div>
      )}

      {sortedNotes.length > 0 && (
        <div className="gf-markdown-notes__list">
          {sortedNotes.map(note => (
            <div
              key={note.id}
              className="gf-markdown-notes__card"
              onClick={() => handleSelectNote(note)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleSelectNote(note) }}
            >
              <div className="gf-markdown-notes__card-header">
                <h3 className={`gf-markdown-notes__card-title ${!note.title ? 'gf-markdown-notes__card-title--empty' : ''}`}>
                  {note.title || 'Untitled'}
                </h3>
                <span className="gf-markdown-notes__card-date">
                  {formatDate(note.updatedAt)}
                </span>
              </div>
              {note.content && (
                <p className="gf-markdown-notes__card-preview">
                  {getPreview(note.content)}
                </p>
              )}
              <button
                className="gf-markdown-notes__card-delete"
                onClick={e => handleDelete(e, note.id)}
                aria-label="Delete note"
                title="Delete note"
              >
                <GfIcon name="close" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
