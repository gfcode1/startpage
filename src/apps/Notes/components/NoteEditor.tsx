import { useMemo, useRef, useEffect } from 'react'
import { GfIcon } from '../../../framework/iconSystem'
import { renderMarkdown, formatDate } from '../utils'
import type { Note } from '../types'
import { useToast } from '../../../framework/ToastContext'

interface NoteEditorProps {
  note: Note | null
  editorTitle: string
  editorContent: string
  saveStatus: 'idle' | 'saving' | 'saved'
  mobileTab: 'edit' | 'preview'
  folders: string[]
  onBack: () => void
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onMobileTabChange: (tab: 'edit' | 'preview') => void
  onFolderChange: (noteId: string, folder: string) => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onDuplicate: (note: Note) => void
}

function insertMarkdown(textarea: HTMLTextAreaElement, before: string, after = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.substring(start, end)
  const insertion = before + selected + after
  textarea.setRangeText(insertion, start, end, 'select')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus()
}

export function NoteEditor({
  note, editorTitle, editorContent, saveStatus,
  mobileTab, folders,
  onBack, onTitleChange, onContentChange, onMobileTabChange,
  onFolderChange, onDelete, onDuplicate,
}: NoteEditorProps) {
  const previewHtml = useMemo(() => renderMarkdown(editorContent), [editorContent])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  const wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0
  const charCount = editorContent.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  useEffect(() => {
    document.documentElement.setAttribute('data-hljs-theme', 'dark')
  }, [])

  const handleToolbarAction = (before: string, after = '') => {
    if (textareaRef.current) {
      insertMarkdown(textareaRef.current, before, after)
    }
  }

  const handleExportPdf = async () => {
    if (!note) return
    addToast('Generating PDF...', 'info')
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.createElement('div')
      let hljsCss = ''
      try {
        hljsCss = Array.from(document.styleSheets)
          .filter(s => s.href?.includes('highlight.js') || s.href?.includes('atom-one-dark'))
          .flatMap(s => { try { return Array.from(s.cssRules || []).map(r => r.cssText) } catch { return [] } })
          .join('')
      } catch { /* silent */ }
      element.innerHTML = `
        <div style="padding: 2rem; font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          ${hljsCss ? `<style>${hljsCss}</style>` : ''}
          <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem; color: #1a1a1a;">${note.title || 'Untitled'}</h1>
          <p style="font-size: 0.8rem; color: #888; margin-bottom: 2rem;">${formatDate(note.updatedAt)}</p>
          ${previewHtml}
        </div>
      `
      document.body.appendChild(element)
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${note.title || 'note'}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save()
      document.body.removeChild(element)
      addToast('PDF exported', 'success')
    } catch {
      addToast('PDF export failed', 'error')
    }
  }

  const handleExportMd = () => {
    if (!note) return
    const blob = new Blob([editorContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title || 'note'}.md`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Markdown exported', 'success')
  }

  const handleExportTxt = () => {
    if (!note) return
    const plain = editorContent
      .replace(/^#+\s+/gm, '').replace(/[*_~`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    const blob = new Blob([plain], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title || 'note'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Text exported', 'success')
  }

  if (!note) return null

  return (
    <div className="gf-notes__editor">
      <div className="gf-notes__editor-header">
        <button
          className="gf-notes__editor-back"
          onClick={onBack}
          aria-label="Back to notes"
        >
          <GfIcon name="chevron-left" size={18} />
        </button>
        <input
          className="gf-notes__editor-title-input"
          type="text"
          value={editorTitle}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Untitled"
          autoFocus={!note.title}
        />
        <div className="gf-notes__editor-actions">
          <span className={`gf-notes__editor-save-status ${saveStatus === 'saving' ? 'gf-notes__editor-save-status--saving' : ''}`}>
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
          <button
            className="gf-notes__btn gf-notes__btn--icon"
            onClick={() => onDuplicate(note)}
            aria-label="Duplicate note"
            title="Duplicate note"
          >
            <GfIcon name="copy" size={14} />
          </button>
          <div className="gf-notes__editor-export-group">
            <button
              className="gf-notes__btn gf-notes__btn--icon"
              onClick={handleExportPdf}
              aria-label="Export PDF"
              title="Export PDF"
            >
              <GfIcon name="download" size={14} />
            </button>
            <div className="gf-notes__editor-export-menu">
              <button onClick={handleExportMd}>Export .md</button>
              <button onClick={handleExportTxt}>Export .txt</button>
            </div>
          </div>
          <button
            className="gf-notes__btn gf-notes__btn--icon gf-notes__btn--danger"
            onClick={e => onDelete(e, note.id)}
            aria-label="Delete note"
            title="Delete note"
          >
            <GfIcon name="trash" size={15} />
          </button>
        </div>
      </div>

      <div className="gf-notes__editor-folder-row">
        <GfIcon name="folder" size={12} />
        <select
          className="gf-notes__editor-folder-select"
          value={note.folder || ''}
          onChange={e => {
            const val = e.target.value
            if (val === '__new__') {
              const name = prompt('New folder name:')
              if (name?.trim()) {
                onFolderChange(note.id, name.trim())
              }
            } else {
              onFolderChange(note.id, val)
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
        {note.folder && (
          <button
            className="gf-notes__editor-folder-clear"
            onClick={() => onFolderChange(note.id, '')}
            aria-label="Remove from folder"
            title="Remove from folder"
          >
            <GfIcon name="close" size={10} />
          </button>
        )}
      </div>

      <div className="gf-notes__editor-toolbar">
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('**', '**')} title="Bold" aria-label="Bold"><strong>B</strong></button>
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('*', '*')} title="Italic" aria-label="Italic"><em>I</em></button>
        <span className="gf-notes__editor-toolbar-sep" />
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('# ')} title="Heading" aria-label="Heading">H</button>
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('- ')} title="List" aria-label="List">≡</button>
        <span className="gf-notes__editor-toolbar-sep" />
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('[', '](url)')} title="Link" aria-label="Link">🔗</button>
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('`', '`')} title="Code" aria-label="Code">{'</>'}</button>
        <button className="gf-notes__editor-toolbar-btn" onClick={() => handleToolbarAction('```\n', '\n```')} title="Code block" aria-label="Code block">{'{ }'}</button>
      </div>

      <div className="gf-notes__editor-mobile-tabs">
        <button
          className={`gf-notes__editor-mobile-tab ${mobileTab === 'edit' ? 'gf-notes__editor-mobile-tab--active' : ''}`}
          onClick={() => onMobileTabChange('edit')}
        >
          Edit
        </button>
        <button
          className={`gf-notes__editor-mobile-tab ${mobileTab === 'preview' ? 'gf-notes__editor-mobile-tab--active' : ''}`}
          onClick={() => onMobileTabChange('preview')}
        >
          Preview
        </button>
      </div>

      <div className="gf-notes__editor-body">
        <textarea
          ref={textareaRef}
          className={`gf-notes__editor-textarea ${mobileTab === 'preview' ? 'gf-notes__editor-textarea--hidden' : ''}`}
          value={editorContent}
          onChange={e => onContentChange(e.target.value)}
          placeholder="Write your notes in Markdown..."
          spellCheck={false}
        />
        <div
          ref={previewRef}
          className={`gf-notes__editor-preview ${mobileTab === 'edit' ? 'gf-notes__editor-preview--hidden' : ''}`}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>

      <div className="gf-notes__editor-statusbar">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
        <span>{readingTime} min read</span>
      </div>
    </div>
  )
}
