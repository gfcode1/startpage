import { useState, useMemo, useCallback, useEffect } from 'react'
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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M12 4l-6 5 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 4.5h9M5.5 4.5V3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5M6 7v3.5M9 7v3.5M3.5 4.5l.7 8.4a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5l.7-8.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New Note
        </button>
      </div>

      {sortedNotes.length === 0 && (
        <div className="gf-markdown-notes__empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
            <rect x="10" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 16h16M16 24h12M16 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
