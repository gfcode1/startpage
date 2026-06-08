import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { renderMarkdown, generateId, formatDate, getPreview, highlightSearch, getFoldersFromNotes } from './utils'
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
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [showFolderSidebar, setShowFolderSidebar] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const editingNote = editingNoteId
    ? notes.find(n => n.id === editingNoteId) ?? null
    : null

  const folders = useMemo(() => getFoldersFromNotes(notes), [notes])

  const filteredNotes = useMemo(() => {
    let result = notes
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

  useEffect(() => {
    if (!editingNoteId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(editingNoteId, editorTitle, editorContent)
      setSaveStatus('saved')
    }, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [editorTitle, editorContent, editingNoteId, updateNote])

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
      folder: selectedFolder,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setNotes(prev => [note, ...prev])
    setEditingNoteId(note.id)
    setEditorTitle('')
    setEditorContent('')
    setMobileTab('edit')
    setSaveStatus('saved')
    addToast('New note created', 'success')
  }, [setNotes, addToast, selectedFolder])

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
    setNotes(prev => prev.filter(n => n.id !== deleteConfirmId))
    if (editingNoteId === deleteConfirmId) {
      setEditingNoteId(null)
    }
    addToast('Note deleted', 'error')
  }, [deleteConfirmId, editingNoteId, setNotes, addToast])

  const handleTitleChange = useCallback((value: string) => {
    setEditorTitle(value)
    setSaveStatus('saving')
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    setSaveStatus('saving')
  }, [])

  const handleSetNoteFolder = useCallback((noteId: string, folder: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, folder } : n
    ))
  }, [setNotes])

  const handleExportPdf = useCallback(async () => {
    if (!editingNote) return
    addToast('Generating PDF...', 'info')

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.createElement('div')
      const hljsCss = Array.from(document.styleSheets)
        .filter(s => s.href?.includes('highlight.js') || s.href?.includes('atom-one-dark'))
        .flatMap(s => { try { return Array.from(s.cssRules || []).map(r => r.cssText) } catch { return [] } })
        .join('')
      element.innerHTML = `
        <div style="padding: 2rem; font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          ${hljsCss ? `<style>${hljsCss}</style>` : ''}
          <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem; color: #1a1a1a;">${editingNote.title || 'Untitled'}</h1>
          <p style="font-size: 0.8rem; color: #888; margin-bottom: 2rem;">${formatDate(editingNote.updatedAt)}</p>
          ${previewHtml}
        </div>
      `
      document.body.appendChild(element)
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${editingNote.title || 'note'}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save()
      document.body.removeChild(element)
      addToast('PDF exported', 'success')
    } catch (e) {
      console.warn('PDF export failed', e)
      addToast('PDF export failed', 'error')
    }
  }, [editingNote, previewHtml, addToast])

  const handleBackRef = useRef(handleBack)

  useEffect(() => {
    handleBackRef.current = handleBack
  }, [handleBack])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingNoteId) {
        handleBackRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editingNoteId])

  useEffect(() => {
    document.documentElement.setAttribute('data-hljs-theme', 'dark')
  }, [])

  return (
    <>
      <div className="gf-markdown-notes">
        {editingNoteId ? (
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
                <span className={`gf-markdown-notes__editor-save-status ${saveStatus === 'saving' ? 'gf-markdown-notes__editor-save-status--saving' : ''}`}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                </span>
                <button
                  className="gf-markdown-notes__btn gf-markdown-notes__btn--icon"
                  onClick={handleExportPdf}
                  aria-label="Export PDF"
                  title="Export PDF"
                >
                  <GfIcon name="download" size={14} />
                </button>
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

            <div className="gf-markdown-notes__editor-folder-row">
              <GfIcon name="folder" size={12} />
                <select
                  className="gf-markdown-notes__editor-folder-select"
                  value={editingNote?.folder || ''}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '__new__') {
                      const name = prompt('New folder name:')
                      if (name?.trim()) {
                        handleSetNoteFolder(editingNoteId, name.trim())
                      }
                    } else {
                      handleSetNoteFolder(editingNoteId, val)
                    }
                  }}
                  aria-label="Select folder"
                >
                  <option value="">No folder</option>
                  {folders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="__new__">+ New folder...</option>
                </select>
              {editingNote?.folder && (
                <button
                  className="gf-markdown-notes__editor-folder-clear"
                  onClick={() => handleSetNoteFolder(editingNoteId, '')}
                  aria-label="Remove from folder"
                  title="Remove from folder"
                >
                  <GfIcon name="close" size={10} />
                </button>
              )}
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
                ref={previewRef}
                className={`gf-markdown-notes__editor-preview ${mobileTab === 'edit' ? 'gf-markdown-notes__editor-preview--hidden' : ''}`}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        ) : (
          <>
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
              <div className="gf-markdown-notes__toolbar-right">
                <button
                  className={`gf-markdown-notes__btn ${showFolderSidebar ? 'gf-markdown-notes__btn--active' : ''}`}
                  onClick={() => setShowFolderSidebar(prev => !prev)}
                  aria-label="Toggle folders"
                  title="Folders"
                >
                  <GfIcon name="folder" size={14} />
                  {folders.length > 0 && <span className="gf-markdown-notes__folder-count">{folders.length}</span>}
                </button>
              </div>
            </div>

            <div className={`gf-markdown-notes__layout ${showFolderSidebar ? 'gf-markdown-notes__layout--sidebar' : ''}`}>
              {showFolderSidebar && (
                <div className="gf-markdown-notes__sidebar-backdrop" onClick={() => setShowFolderSidebar(false)} />
              )}
              {showFolderSidebar && (
                <aside className="gf-markdown-notes__sidebar">
                  <button
                    className={`gf-markdown-notes__sidebar-item ${!selectedFolder ? 'gf-markdown-notes__sidebar-item--active' : ''}`}
                    onClick={() => setSelectedFolder('')}
                  >
                    <GfIcon name="document" size={14} />
                    All Notes
                    <span className="gf-markdown-notes__sidebar-count">{notes.length}</span>
                  </button>
                  {folders.map(folder => {
                    const count = notes.filter(n => n.folder === folder).length
                    return (
                      <button
                        key={folder}
                        className={`gf-markdown-notes__sidebar-item ${selectedFolder === folder ? 'gf-markdown-notes__sidebar-item--active' : ''}`}
                        onClick={() => setSelectedFolder(folder)}
                      >
                        <GfIcon name="folder" size={14} />
                        {folder}
                        <span className="gf-markdown-notes__sidebar-count">{count}</span>
                      </button>
                    )
                  })}
                  <button
                    className="gf-markdown-notes__sidebar-item gf-markdown-notes__sidebar-item--new"
                    onClick={() => {
                      const name = prompt('Folder name:')
                      if (name?.trim()) {
                        setSelectedFolder(name.trim())
                      }
                    }}
                  >
                    <GfIcon name="plus" size={12} />
                    New Folder
                  </button>
                </aside>
              )}

              <div className="gf-markdown-notes__main">
                {sortedNotes.length === 0 && search && (
                  <GfEmptyState
                    icon={<GfIcon name="search" size={24} />}
                    title="No notes match your search"
                    description="Try different keywords"
                  />
                )}
                {sortedNotes.length === 0 && !search && selectedFolder && (
                  <GfEmptyState
                    icon={<GfIcon name="folder" size={24} />}
                    title={`No notes in "${selectedFolder}"`}
                    description="Create a note in this folder to get started"
                    action={{ label: 'Create note', onClick: handleNewNote }}
                  />
                )}
                {sortedNotes.length === 0 && !search && !selectedFolder && (
                  <GfEmptyState
                    icon={<GfIcon name="document" size={24} />}
                    title="No notes yet"
                    description="Create your first note to get started"
                    action={{ label: 'Create your first note', onClick: handleNewNote }}
                  />
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
                            {search ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearch(note.title || 'Untitled', search) }} />
                            ) : (
                              note.title || 'Untitled'
                            )}
                          </h3>
                          <span className="gf-markdown-notes__card-date">
                            {formatDate(note.updatedAt)}
                          </span>
                        </div>
                        {note.content && (
                          <p className="gf-markdown-notes__card-preview">
                            {search ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearch(getPreview(note.content, 150), search) }} />
                            ) : (
                              getPreview(note.content)
                            )}
                          </p>
                        )}
                        <div className="gf-markdown-notes__card-footer-row">
                          {note.folder && (
                            <span className="gf-markdown-notes__card-folder">
                              <GfIcon name="folder" size={10} />
                              {note.folder}
                            </span>
                          )}
                        </div>
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
