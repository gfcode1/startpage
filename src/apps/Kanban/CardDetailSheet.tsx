import { useState, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { formatDate, formatDueDate, isOverdue, generateId, PRIORITY_LABELS, COVER_COLORS } from './utils'
import type { KanbanCard, Priority, TagDef } from './types'

interface Props {
  card: KanbanCard | null
  tags: TagDef[]
  open: boolean
  onClose: () => void
  onSave: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
}

export function CardDetailSheet({ card, tags, open, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [cardTags, setCardTags] = useState<string[]>([])
  const [assignee, setAssignee] = useState('')
  const [coverColor, setCoverColor] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([])
  const [dueDate, setDueDate] = useState<number | null>(null)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  if (!card) return null

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      ...card,
      title: title.trim(),
      description,
      priority,
      tags: cardTags,
      assignee,
      coverColor,
      checklist,
      dueDate,
      updatedAt: Date.now(),
    })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSave()
    }
  }

  const handleDatePick = () => {
    const current = dueDate ? new Date(dueDate) : new Date()
    const dateStr = current.toISOString().split('T')[0]
    const input = document.createElement('input')
    input.type = 'date'
    input.value = dateStr
    input.style.position = 'fixed'
    input.style.opacity = '0'
    input.style.pointerEvents = 'none'
    document.body.appendChild(input)

    const cleanup = () => {
      if (input.parentNode) document.body.removeChild(input)
    }

    input.addEventListener('input', () => {
      if (input.value) {
        const d = new Date(input.value + 'T12:00:00')
        setDueDate(d.getTime())
      }
      cleanup()
    })
    input.addEventListener('blur', cleanup)

    try {
      input.showPicker()
    } catch {
      cleanup()
    }
  }

  const handleAddCheckItem = () => {
    const text = newCheckItem.trim()
    if (!text) return
    setChecklist(prev => [...prev, { id: generateId(), text, completed: false }])
    setNewCheckItem('')
  }

  const handleToggleCheck = (id: string) => {
    setChecklist(prev =>
      prev.map(c => (c.id === id ? { ...c, completed: !c.completed } : c)),
    )
  }

  const handleDeleteCheck = (id: string) => {
    setChecklist(prev => prev.filter(c => c.id !== id))
  }

  const handleToggleTag = (tag: string) => {
    setCardTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  const overdue = dueDate && isOverdue(dueDate)

  const priorities: Priority[] = ['low', 'medium', 'high', 'critical']

  return (
    <>
      <GfBottomSheet open={open} onClose={handleSave} title="Card Details">
        <div key={card.id} className="gf-kanban-detail" onKeyDown={handleKeyDown}>
          <input
            ref={titleRef}
            className="gf-kanban-detail__title-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Card title..."
            aria-label="Card title"
          />

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Description</span>
            <textarea
              className="gf-kanban-detail__desc-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              aria-label="Description"
            />
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Priority</span>
            <div className="gf-kanban-detail__priority-row">
              {priorities.map(p => (
                <button
                  key={p}
                  className={
                    `gf-kanban-detail__priority-btn ` +
                    `gf-kanban-detail__priority-btn--${p} ` +
                    `${priority === p ? 'gf-kanban-detail__priority-btn--active' : ''}`
                  }
                  onClick={() => setPriority(p)}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Assignee</span>
            <input
              className="gf-kanban-detail__assignee-input"
              type="text"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              placeholder="Unassigned"
              aria-label="Assignee"
            />
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Due Date</span>
            <button
              className={
                `gf-kanban-detail__due-btn ` +
                `${dueDate ? 'gf-kanban-detail__due-btn--set' : ''} ` +
                `${overdue ? 'gf-kanban-detail__due-btn--overdue' : ''}`
              }
              onClick={handleDatePick}
            >
              <GfIcon name="calendar" size={14} />
              {dueDate ? formatDueDate(dueDate) : 'Set due date'}
              {dueDate && (
                <span
                  style={{ marginLeft: '0.25rem', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setDueDate(null) }}
                  role="button"
                  aria-label="Clear due date"
                >
                  <GfIcon name="close" size={12} />
                </span>
              )}
            </button>
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Tags</span>
            <div className="gf-kanban-detail__tags">
              {tags.length === 0 && (
                <span style={{ fontSize: '0.78rem', opacity: 0.4 }}>No tags yet</span>
              )}
              {tags.map(tag => (
                <button
                  key={tag.name}
                  className={
                    `gf-kanban-detail__tag-btn ` +
                    `${cardTags.includes(tag.name) ? 'gf-kanban-detail__tag-btn--active' : ''}`
                  }
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                  onClick={() => handleToggleTag(tag.name)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">Cover Color</span>
            <div className="gf-kanban-detail__cover-row">
              <button
                className={`gf-kanban-detail__cover-btn gf-kanban-detail__cover-btn--none ${!coverColor ? 'gf-kanban-detail__cover-btn--active' : ''}`}
                onClick={() => setCoverColor(null)}
                title="No cover"
              >
                /
              </button>
              {COVER_COLORS.map(color => (
                <button
                  key={color}
                  className={`gf-kanban-detail__cover-btn ${coverColor === color ? 'gf-kanban-detail__cover-btn--active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setCoverColor(color)}
                  title={color}
                  aria-label={`Cover color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="gf-kanban-detail__section">
            <span className="gf-kanban-detail__section-label">
              Checklist ({checklist.filter(c => c.completed).length}/{checklist.length})
            </span>
            <div className="gf-kanban-detail__checklist">
              {checklist.map(item => (
                <div key={item.id} className="gf-kanban-detail__checklist-item">
                  <button
                    className={`gf-kanban-detail__checklist-check ${item.completed ? 'gf-kanban-detail__checklist-check--done' : ''}`}
                    onClick={() => handleToggleCheck(item.id)}
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {item.completed && <GfIcon name="check" size={12} />}
                  </button>
                  <span className={`gf-kanban-detail__checklist-text ${item.completed ? 'gf-kanban-detail__checklist-text--done' : ''}`}>
                    {item.text}
                  </span>
                  <button
                    className="gf-kanban-detail__checklist-delete"
                    onClick={() => handleDeleteCheck(item.id)}
                    aria-label="Delete checklist item"
                  >
                    <GfIcon name="close" size={12} />
                  </button>
                </div>
              ))}
              <div className="gf-kanban-detail__checklist-add">
                <input
                  className="gf-kanban-detail__checklist-input"
                  type="text"
                  value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCheckItem() }}
                  placeholder="Add checklist item..."
                  aria-label="Add checklist item"
                />
                <button
                  className="gf-kanban-detail__checklist-add-btn"
                  onClick={handleAddCheckItem}
                  disabled={!newCheckItem.trim()}
                  aria-label="Add item"
                >
                  <GfIcon name="plus" size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="gf-kanban-detail__footer">
            <div className="gf-kanban-detail__timestamps">
              <div>Created {formatDate(card.createdAt)}</div>
            </div>
            <button
              className="gf-kanban-detail__delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <GfIcon name="trash" size={12} />
              Delete
            </button>
          </div>
        </div>
      </GfBottomSheet>

      <GfConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { onDelete(card.id); setShowDeleteConfirm(false); onClose() }}
        title="Delete card?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  )
}
