import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../../../framework/iconSystem'
import { GfWidgetAction } from '../../../../framework/components/WidgetAction'
import { useAppStorage } from '../../../../framework/persistence/useAppStorage'
import type { Note } from '../../types'
import './RecentNotesWidget.css'

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

export default function RecentNotesWidget() {
  const navigate = useNavigate()
  const [notes] = useAppStorage<Note[]>('notes', 'notes', [])

  if (notes.length === 0) {
    return (
      <div className="gf-widget-recentnotes">
        <GfWidgetAction label="Create a new note" onClick={() => navigate('/notes')} />
      </div>
    )
  }

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3)

  return (
    <div className="gf-widget-recentnotes">
      <div className="gf-widget-recentnotes__header">
        <GfIcon name="document" size={14} />
        <span className="gf-widget-recentnotes__label">Recent Notes</span>
        <button className="gf-widget-recentnotes__open" onClick={() => navigate('/notes')} aria-label="Open Notes">
          <GfIcon name="chevron-right" size={14} />
        </button>
      </div>
      <ul className="gf-widget-recentnotes__list">
        {sorted.map(n => (
          <li key={n.id} className="gf-widget-recentnotes__item">
            <span className="gf-widget-recentnotes__bullet" />
            <div className="gf-widget-recentnotes__content">
              <span className="gf-widget-recentnotes__title">{n.title || 'Untitled'}</span>
              <span className="gf-widget-recentnotes__preview">{firstLine(n.content)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
