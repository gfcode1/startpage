import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GfIcon } from '../../framework/iconSystem'
import { formatDueDate, isOverdue } from './utils'
import type { KanbanCard as KanbanCardType } from './types'

interface Props {
  card: KanbanCardType
  completed?: boolean
  tagColors: Map<string, string>
  onClick: () => void
}

export function KanbanCard({ card, completed, tagColors, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', columnId: card.columnId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue = card.dueDate && !completed && isOverdue(card.dueDate)
  const checklistTotal = card.checklist.length
  const checklistDone = card.checklist.filter(c => c.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        `gf-kanban__card ` +
        `gf-kanban__card--${card.priority} ` +
        `${isDragging ? 'gf-kanban__card--dragging' : ''} ` +
        `${completed ? 'gf-kanban__card--completed' : ''}`
      }
      onClick={onClick}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={card.title}
    >
      {card.coverColor && (
        <div className="gf-kanban__card-cover" style={{ background: card.coverColor }} />
      )}

      <div className="gf-kanban__card-title">{card.title}</div>

      {(card.tags.length > 0 || card.dueDate || card.assignee || checklistTotal > 0) && (
        <div className="gf-kanban__card-meta">
          {card.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="gf-kanban__card-tag"
              style={{ '--tag-color': tagColors.get(tag) || '#888' } as React.CSSProperties}
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 2 && (
            <span className="gf-kanban__card-tag" style={{ '--tag-color': '#888' } as React.CSSProperties}>
              +{card.tags.length - 2}
            </span>
          )}
          {card.dueDate && (
            <span className={`gf-kanban__card-due ${overdue ? 'gf-kanban__card-due--overdue' : ''}`}>
              <GfIcon name="calendar" size={10} />
              {formatDueDate(card.dueDate)}
            </span>
          )}
          {card.assignee && (
            <span className="gf-kanban__card-assignee">
              {card.assignee}
            </span>
          )}
        </div>
      )}

      <div className="gf-kanban__card-footer">
        {checklistTotal > 0 && (
          <span className="gf-kanban__card-checklist-progress">
            <GfIcon name="checklist" size={10} />
            {checklistDone}/{checklistTotal}
          </span>
        )}
        <span className={`gf-kanban__card-priority-badge gf-kanban__card-priority-badge--${card.priority}`}>
          {card.priority}
        </span>
      </div>
    </div>
  )
}
