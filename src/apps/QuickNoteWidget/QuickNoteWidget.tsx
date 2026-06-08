import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
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
        <GfWidgetAction label="Create a note in Markdown" onClick={() => navigate('/markdownnotes')} />
      </div>
    )
  }

  const latest = notes.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
  return (
    <div className="gf-widget-quicknote">
      <div className="gf-widget-quicknote__header">
        <span className="gf-widget-quicknote__label">Latest Note</span>
        <button className="gf-widget-quicknote__open" onClick={() => navigate('/markdownnotes')} aria-label="Open Markdown Notes">
          <GfIcon name="chevron-right" size={14} />
        </button>
      </div>
      <span className="gf-widget-quicknote__title">{latest.title || 'Untitled'}</span>
      <span className="gf-widget-quicknote__preview">{firstLine(latest.content)}</span>
    </div>
  )
}
