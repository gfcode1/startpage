import { useState } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import type { KanbanBoard } from './types'

interface Props {
  boards: KanbanBoard[]
  activeBoardId: string
  open: boolean
  onClose: () => void
  onSelect: (boardId: string) => void
  onAdd: (name: string) => void
  onDelete: (boardId: string) => void
}

export function BoardManager({ boards, activeBoardId, open, onClose, onSelect, onAdd, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAdd(name)
    setNewName('')
  }

  return (
    <>
      <GfBottomSheet open={open} onClose={onClose} title="Manage Boards">
        <div className="gf-kanban-board-mgr">
          {boards.map(board => (
            <div
              key={board.id}
              className={
                `gf-kanban-board-mgr__item ` +
                `${board.id === activeBoardId ? 'gf-kanban-board-mgr__item--active' : ''}`
              }
              onClick={() => { onSelect(board.id); onClose() }}
              role="button"
              tabIndex={0}
            >
              <span className="gf-kanban-board-mgr__name">{board.name}</span>
              {board.id === activeBoardId && (
                <span className="gf-kanban-board-mgr__active-badge">Active</span>
              )}
              <span className="gf-kanban-board-mgr__count">
                {board.columns.length} columns
              </span>
              {boards.length > 1 && (
                <button
                  className="gf-kanban-board-mgr__delete"
                  onClick={e => { e.stopPropagation(); setDeleteId(board.id) }}
                  aria-label="Delete board"
                >
                  <GfIcon name="close" size={12} />
                </button>
              )}
            </div>
          ))}

          <div className="gf-kanban-board-mgr__add" style={{ marginTop: '0.5rem' }}>
            <input
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="New board name..."
              aria-label="New board name"
            />
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                border: 'none',
                borderRadius: 'var(--gf-radius-sm)',
                background: 'var(--gf-accent)',
                color: 'var(--gf-text-inverse)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onClick={handleAdd}
              disabled={!newName.trim()}
              aria-label="Add board"
            >
              <GfIcon name="plus" size={14} />
            </button>
          </div>
        </div>
      </GfBottomSheet>

      <GfConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { onDelete(deleteId!); setDeleteId(null) }}
        title="Delete board?"
        message="All columns and cards in this board will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  )
}
