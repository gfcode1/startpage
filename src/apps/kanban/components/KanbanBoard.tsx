import { useState, useCallback } from 'react'
import { Container, Group, Center, Stack, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import {
  useKanbanColumns, useKanbanAddCard, useKanbanUpdateCard,
  useKanbanDeleteCard, useKanbanDuplicateCard, useKanbanArchiveCard, useKanbanRestoreCard,
  useKanbanMoveCard, useKanbanRenameColumn, useKanbanDeleteColumn, useKanbanMoveColumn,
  getKanbanColumns,
} from '@/stores/kanban-store'
import type { Card } from '../types'
import { KanbanHeader } from './KanbanHeader'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCardModal, type CardFormData } from './KanbanCardModal'

export function KanbanBoard() {
  const columns = useKanbanColumns()
  const addCard = useKanbanAddCard()
  const updateCard = useKanbanUpdateCard()
  const deleteCard = useKanbanDeleteCard()
  const duplicateCard = useKanbanDuplicateCard()
  const archiveCard = useKanbanArchiveCard()
  const restoreCard = useKanbanRestoreCard()
  const moveCard = useKanbanMoveCard()
  const renameColumn = useKanbanRenameColumn()
  const deleteColumn = useKanbanDeleteColumn()
  const moveColumn = useKanbanMoveColumn()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [cardColumnId, setCardColumnId] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const isMobile = useMediaQuery('(max-width: 47.999em)')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const openNewCard = useCallback((columnId: string) => {
    setEditingCard(null)
    setCardColumnId(columnId)
    setModalOpen(true)
  }, [])

  const openEditCard = useCallback((card: Card) => {
    setEditingCard(card)
    setCardColumnId('')
    setModalOpen(true)
  }, [])

  const handleSaveCard = useCallback((data: CardFormData) => {
    if (editingCard) {
      updateCard(editingCard.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        labels: data.labels,
        dueDate: data.dueDate,
        assignee: data.assignee,
      })
    } else if (cardColumnId) {
      addCard(cardColumnId, data.title, data.description, data.priority, data.labels, data.dueDate, data.assignee)
    }
  }, [editingCard, cardColumnId, addCard, updateCard])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const cols = getKanbanColumns()

    if (activeId.startsWith('col:')) {
      const fromIndex = cols.findIndex((c) => `col:${c.id}` === activeId)
      const overId = over.id as string
      let toIndex = cols.findIndex((c) => `col:${c.id}` === overId)
      if (toIndex === -1) {
        toIndex = cols.findIndex((c) => `col-drop:${c.id}` === overId)
      }
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        moveColumn(fromIndex, toIndex)
      }
      return
    }

    const cardId = activeId
    const targetId = over.id as string
    let targetColumnId: string | undefined
    let targetIndex: number | undefined

    if (targetId.startsWith('col-drop:')) {
      targetColumnId = targetId.replace('col-drop:', '')
    } else if (targetId.startsWith('col:')) {
      targetColumnId = targetId.replace('col:', '')
    } else {
      for (const col of cols) {
        const idx = col.cards.findIndex((c) => c.id === targetId)
        if (idx !== -1) {
          targetColumnId = col.id
          targetIndex = idx
          break
        }
      }
    }

    if (targetColumnId) {
      moveCard(cardId, targetColumnId, targetIndex)
    }
  }, [moveCard, moveColumn])

  if (columns.length === 0) {
    return (
      <Container size="xl" py="md">
        <KanbanHeader showArchived={showArchived} onToggleArchived={() => setShowArchived((v) => !v)} />
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No columns yet</Text>
            <Text size="sm" c="dimmed">Add a column using the input above</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <KanbanHeader showArchived={showArchived} onToggleArchived={() => setShowArchived((v) => !v)} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={columns.map((c) => `col:${c.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {isMobile ? (
            <Stack gap="md" style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  columnCount={columns.length}
                  showArchived={showArchived}
                  onAddCard={openNewCard}
                  onEditCard={openEditCard}
                  onDeleteCard={deleteCard}
                  onDuplicateCard={duplicateCard}
                  onArchiveCard={archiveCard}
                  onRestoreCard={restoreCard}
                  onDetailCard={() => {}}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                />
              ))}
            </Stack>
          ) : (
            <Group gap="md" align="flex-start" wrap="nowrap" style={{ overflow: 'auto', flex: 1, paddingBottom: 16 }}>
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  columnCount={columns.length}
                  showArchived={showArchived}
                  onAddCard={openNewCard}
                  onEditCard={openEditCard}
                  onDeleteCard={deleteCard}
                  onDuplicateCard={duplicateCard}
                  onArchiveCard={archiveCard}
                  onRestoreCard={restoreCard}
                  onDetailCard={() => {}}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                />
              ))}
            </Group>
          )}
        </SortableContext>
      </DndContext>

      <KanbanCardModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCard}
        editingCard={editingCard}
      />
    </Container>
  )
}
