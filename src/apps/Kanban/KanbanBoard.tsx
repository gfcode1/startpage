import { useState, useMemo, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { GfIcon } from '../../framework/iconSystem'
import { KanbanColumn } from './KanbanColumn'
import { generateId } from './utils'
import type { KanbanBoard as KanbanBoardType, KanbanCard as KanbanCardType, TagDef } from './types'

interface Props {
  board: KanbanBoardType
  cards: Record<string, KanbanCardType>
  tags: TagDef[]
  onUpdateCards: (updater: (prev: Record<string, KanbanCardType>) => Record<string, KanbanCardType>) => void
  onUpdateBoard: (updater: (prev: KanbanBoardType) => KanbanBoardType) => void
  onCardClick: (card: KanbanCardType) => void
}

export function KanbanBoardComponent({
  board,
  cards,
  tags,
  onUpdateCards,
  onUpdateBoard,
  onCardClick,
}: Props) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'card' | 'column' | null>(null)

  const sortedColumns = useMemo(
    () => [...board.columns].sort((a, b) => a.order - b.order),
    [board.columns],
  )

  const columnCardsMap = useMemo(() => {
    const map: Record<string, KanbanCardType[]> = {}
    for (const col of board.columns) {
      map[col.id] = []
    }
    for (const card of Object.values(cards)) {
      if (map[card.columnId]) {
        map[card.columnId].push(card)
      }
    }
    for (const col of board.columns) {
      map[col.id].sort((a, b) => a.order - b.order)
    }
    return map
  }, [board.columns, cards])

  const tagColors = useMemo(() => {
    const map = new Map(tags.map(t => [t.name, t.color]))
    return map
  }, [tags])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleAddCard = useCallback((columnId: string) => {
    const title = prompt('Card title:')
    if (!title || !title.trim()) return
    const columnCards = columnCardsMap[columnId] || []
    const newCard: KanbanCardType = {
      id: generateId(),
      title: title.trim(),
      description: '',
      columnId,
      order: columnCards.length,
      priority: 'medium',
      tags: [],
      dueDate: null,
      assignee: '',
      checklist: [],
      coverColor: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    onUpdateCards(prev => ({ ...prev, [newCard.id]: newCard }))
  }, [columnCardsMap, onUpdateCards])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveDragId(id)
    const data = event.active.data.current
    setActiveDragType(data?.type || 'card')
  }, [])

  const handleColumnDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIdx = sortedColumns.findIndex(c => c.id === active.id)
    const overIdx = sortedColumns.findIndex(c => c.id === over.id)
    if (activeIdx === -1 || overIdx === -1) return

    const reordered = arrayMove(sortedColumns, activeIdx, overIdx)
    onUpdateBoard(prev => ({
      ...prev,
      columns: reordered.map((col, i) => ({ ...col, order: i })),
    }))
  }, [sortedColumns, onUpdateBoard])

  const handleCardDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCardId = String(active.id)
    const activeData = active.data.current
    const overData = over.data.current

    const fromColumnId = activeData?.columnId || ''
    let toColumnId = overData?.columnId || ''

    const overCardId = String(over.id)
    const isOverColumn = overData?.type === 'column'

    const activeCard = cards[activeCardId]
    if (!activeCard) return

    if (isOverColumn) {
      toColumnId = overCardId
    }

    const fromCards = [...(columnCardsMap[fromColumnId] || [])]
    const activeIdx = fromCards.findIndex(c => c.id === activeCardId)

    if (fromColumnId === toColumnId) {
      if (!isOverColumn) {
        const overIdx = fromCards.findIndex(c => c.id === overCardId)
        if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return
        const reordered = arrayMove(fromCards, activeIdx, overIdx)
        onUpdateCards(prev => {
          const next = { ...prev }
          reordered.forEach((card, i) => {
            next[card.id] = { ...card, order: i }
          })
          return next
        })
      }
    } else {
      const toCards = [...(columnCardsMap[toColumnId] || [])]

      let insertIdx = toCards.length
      if (!isOverColumn) {
        const overIdx = toCards.findIndex(c => c.id === overCardId)
        if (overIdx !== -1) insertIdx = overIdx
      }

      const card = { ...activeCard, columnId: toColumnId }
      toCards.splice(insertIdx, 0, card)

      onUpdateCards(prev => {
        const next = { ...prev }
        toCards.forEach((c, i) => {
          next[c.id] = { ...c, order: i }
        })
        const remainingFrom = cards[activeCardId]
          ? fromCards.filter(c => c.id !== activeCardId)
          : fromCards
        remainingFrom.forEach((c, i) => {
          if (next[c.id]) {
            next[c.id] = { ...next[c.id], order: i }
          }
        })
        return next
      })
    }
  }, [cards, columnCardsMap, onUpdateCards])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const data = event.active.data.current
    if (data?.type === 'column') {
      handleColumnDragEnd(event)
    } else {
      handleCardDragEnd(event)
    }
    setActiveDragId(null)
    setActiveDragType(null)
  }, [handleColumnDragEnd, handleCardDragEnd])

  const handleRenameColumn = useCallback((columnId: string, name: string) => {
    onUpdateBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === columnId ? { ...c, name } : c),
    }))
  }, [onUpdateBoard])

  const handleDeleteColumn = useCallback((columnId: string) => {
    onUpdateBoard(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c.id !== columnId),
    }))
    onUpdateCards(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key].columnId === columnId) {
          delete next[key]
        }
      }
      return next
    })
  }, [onUpdateBoard, onUpdateCards])

  const handleAddColumn = useCallback(() => {
    const name = prompt('Column name:')
    if (!name || !name.trim()) return
    const newColumn = {
      id: generateId(),
      name: name.trim(),
      color: '#888',
      order: board.columns.length,
    }
    onUpdateBoard(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn],
    }))
  }, [board.columns.length, onUpdateBoard])

  const activeCard = activeDragType === 'card' && activeDragId ? cards[activeDragId] : null

  return (
    <div className="gf-kanban__board-area">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setActiveDragId(null); setActiveDragType(null) }}
      >
        <SortableContext items={sortedColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {sortedColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={columnCardsMap[column.id] || []}
              tagColors={tagColors}
              isDoneColumn={column.name.toLowerCase() === 'done'}
              onAddCard={handleAddCard}
              onCardClick={onCardClick}
              onRename={handleRenameColumn}
              onDelete={handleDeleteColumn}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeDragType === 'card' && activeCard && (
            <div className="gf-kanban__card--overlay">
              <div className="gf-kanban__card-title" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                {activeCard.title}
              </div>
              <div className={`gf-kanban__card-priority-badge gf-kanban__card-priority-badge--${activeCard.priority}`}>
                {activeCard.priority}
              </div>
            </div>
          )}
          {activeDragType === 'column' && activeDragId && (
            <div className="gf-kanban__column" style={{ opacity: 0.8, transform: 'rotate(2deg)' }}>
              <div className="gf-kanban__column-header">
                <span className="gf-kanban__column-name">
                  {sortedColumns.find(c => c.id === activeDragId)?.name || ''}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <button className="gf-kanban__add-column" onClick={handleAddColumn}>
        <GfIcon name="plus" size={14} />
        Add Column
      </button>
    </div>
  )
}
