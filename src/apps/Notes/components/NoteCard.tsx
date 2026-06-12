import type { Note } from '../types'
import { GfIcon } from '../../../framework/iconSystem'
import { formatDate, getPreview, highlightSearch } from '../utils'

interface NoteCardProps {
  note: Note
  search: string
  onSelect: (note: Note) => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onTogglePin: (id: string) => void
}

export function NoteCard({ note, search, onSelect, onDelete, onTogglePin }: NoteCardProps) {
  const isUntitled = !note.title

  return (
    <div
      className="gf-notes__card"
      onClick={() => onSelect(note)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onSelect(note) }}
    >
      {note.pinned && (
        <span className="gf-notes__card-pin-badge" title="Pinned">
          <GfIcon name="star" size={12} />
        </span>
      )}
      <div className="gf-notes__card-header">
        <h3 className={`gf-notes__card-title ${isUntitled ? 'gf-notes__card-title--empty' : ''}`}>
          {search ? (
            <span dangerouslySetInnerHTML={{ __html: highlightSearch(note.title || 'Untitled', search) }} />
          ) : (
            note.title || 'Untitled'
          )}
        </h3>
        <span className="gf-notes__card-date">
          {formatDate(note.updatedAt)}
        </span>
      </div>
      {note.content && (
        <p className="gf-notes__card-preview">
          {search ? (
            <span dangerouslySetInnerHTML={{ __html: highlightSearch(getPreview(note.content, 150), search) }} />
          ) : (
            getPreview(note.content)
          )}
        </p>
      )}
      <div className="gf-notes__card-footer-row">
        {note.folder && (
          <span className="gf-notes__card-folder">
            <GfIcon name="folder" size={10} />
            {note.folder}
          </span>
        )}
      </div>
      <div className="gf-notes__card-actions">
        <button
          className={`gf-notes__card-action-btn ${note.pinned ? 'gf-notes__card-action-btn--active' : ''}`}
          onClick={e => { e.stopPropagation(); onTogglePin(note.id) }}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          <GfIcon name="star" size={12} />
        </button>
        <button
          className="gf-notes__card-action-btn gf-notes__card-action-btn--danger"
          onClick={e => onDelete(e, note.id)}
          aria-label="Delete note"
          title="Delete note"
        >
          <GfIcon name="close" size={12} />
        </button>
      </div>
    </div>
  )
}
