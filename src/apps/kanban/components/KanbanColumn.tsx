import { useState, useMemo } from 'react'
import { Text, Paper, Group, ActionIcon, Badge, TextInput, Stack } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column, Card } from '../types'
import { useKanbanSearchQuery, useKanbanFilter } from '@/stores/kanban-store'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  column: Column
  columnCount: number
  onAddCard: (columnId: string) => void
  onEditCard: (card: Card) => void
  onDeleteCard: (id: string) => void
  onDetailCard: (card: Card) => void
  onRenameColumn: (id: string, title: string) => void
  onDeleteColumn: (id: string) => void
}

export function KanbanColumn({
  column, columnCount, onAddCard, onEditCard, onDeleteCard,
  onDetailCard, onRenameColumn, onDeleteColumn,
}: KanbanColumnProps) {
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(column.title)
  const searchQuery = useKanbanSearchQuery()
  const filter = useKanbanFilter()
  const [parent] = useAutoAnimate()

  const cards = useMemo(() => {
    let result = column.cards
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q) ||
          c.labels.some((l) => l.toLowerCase().includes(q)),
      )
    }
    if (filter !== 'all') {
      result = result.filter((c) => c.priority === filter)
    }
    return result
  }, [column.cards, searchQuery, filter])

  const { setNodeRef: setDroppableRef } = useDroppable({ id: `col-drop:${column.id}` })

  const handleRename = () => {
    onRenameColumn(column.id, editName)
    setEditingName(false)
  }

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{ minWidth: 280, maxWidth: 320, flex: 1, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 140px)' }}
    >
      <Group justify="space-between" mb="sm" style={{ flexShrink: 0 }}>
        {editingName ? (
          <TextInput
            value={editName}
            onChange={(e) => setEditName(e.currentTarget.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setEditingName(false)
            }}
            size="xs"
            autoFocus
          />
        ) : (
          <Text
            size="sm"
            fw={600}
            style={{ cursor: 'pointer' }}
            onClick={() => { setEditName(column.title); setEditingName(true) }}
          >
            {column.title}
          </Text>
        )}
        <Group gap={4} wrap="nowrap">
          <Badge size="xs" variant="light">{column.cards.length}</Badge>
          <ActionIcon size="xs" variant="subtle" onClick={() => onAddCard(column.id)} aria-label="Add card">
            <Icon icon="lucide:plus" width={14} />
          </ActionIcon>
          {columnCount > 1 && (
            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onDeleteColumn(column.id)} aria-label="Delete column">
              <Icon icon="lucide:x" width={12} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <div ref={setDroppableRef} style={{ flex: 1, overflowY: 'auto', minHeight: 40 }}>
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <Stack gap="xs" ref={parent}>
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                onDetail={onDetailCard}
              />
            ))}
          </Stack>
        </SortableContext>

        {cards.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" py="sm">No cards</Text>
        )}
      </div>
    </Paper>
  )
}
