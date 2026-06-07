import { useNavigate } from 'react-router-dom'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './QuickNoteWidget.css'

interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '').replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/`{1,3}.*?`{1,3}/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s/gm, '').replace(/^\d+\.\s/gm, '').replace(/>\s/g, '')
    .replace(/\n{2,}/g, ' ').trim()
}

function firstLine(text: string): string {
  const raw = stripMarkdown(text)
  return raw.split('\n').filter(Boolean)[0] || 'Empty note'
}

export default function QuickNoteWidget() {
  const navigate = useNavigate()
  const [notes] = useAppStorage<Note[]>('markdownnotes', 'notes', [])

  if (notes.length === 0) {
    return (
      <div className="gf-widget-quicknote">
        <button className="gf-widget-quicknote__action" onClick={() => navigate('/markdownnotes')}>
          Create a note in Markdown
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 3l4 4-4 4" />
          </svg>
        </button>
      </div>
    )
  }

  const latest = notes.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
  return (
    <div className="gf-widget-quicknote">
      <div className="gf-widget-quicknote__header">
        <span className="gf-widget-quicknote__label">Latest Note</span>
        <button className="gf-widget-quicknote__open" onClick={() => navigate('/markdownnotes')} aria-label="Open Markdown Notes">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </button>
      </div>
      <span className="gf-widget-quicknote__title">{latest.title || 'Untitled'}</span>
      <span className="gf-widget-quicknote__preview">{firstLine(latest.content)}</span>
    </div>
  )
}
