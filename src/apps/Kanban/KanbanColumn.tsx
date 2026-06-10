import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GfIcon } from '../../framework/iconSystem'
import { KanbanCard } from './KanbanCard'
import type { KanbanCard as KanbanCardType, KanbanColumn as KanbanColumnType } from './types'

interface Props {
  column: KanbanColumnType
  cards: KanbanCardType[]
  tagColors: Map<string, string>
  isDoneColumn: boolean
  onAddCard: (columnId: string) => void
  onCardClick: (card: KanbanCardType) => void
  onRename: (columnId: string, name: string) => void
  onDelete: (columnId: string) => void
}

export function KanbanColumn({
  column,
  cards,
  tagColors,
  isDoneColumn,
  onAddCard,
  onCardClick,
  onRename,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="gf-kanban__column">
      <div className="gf-kanban__column-header">
        <div className="gf-kanban__column-drag" {...attributes} {...listeners} aria-label="Drag column">
          <GfIcon name="drag-handle" size={12} />
        </div>
        <div className="gf-kanban__column-color" style={{ background: column.color }} />
        <span className="gf-kanban__column-name">{column.name}</span>
        <span className="gf-kanban__column-count">{cards.length}</span>
        <div className="gf-kanban__column-actions">
          <button
            className="gf-kanban__column-action-btn"
            onClick={() => {
              const name = prompt('Rename column:', column.name)
              if (name && name.trim()) onRename(column.id, name.trim())
            }}
            aria-label="Rename column"
            title="Rename"
          >
            <GfIcon name="edit" size={12} />
          </button>
          <button
            className="gf-kanban__column-action-btn"
            onClick={() => {
              if (confirm('Delete this column and all its cards?')) onDelete(column.id)
            }}
            aria-label="Delete column"
            title="Delete"
          >
            <GfIcon name="close" size={12} />
          </button>
        </div>
      </div>

      <div className="gf-kanban__column-cards">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              completed={isDoneColumn}
              tagColors={tagColors}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>
      </div>

      <button className="gf-kanban__column-add" onClick={() => onAddCard(column.id)}>
        <GfIcon name="plus" size={12} />
        Add card
      </button>
    </div>
  )
}
