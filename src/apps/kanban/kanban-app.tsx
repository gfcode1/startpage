import { useState, useEffect, useCallback } from 'react'
import {
  Container, Text, Group, Paper, ActionIcon, TextInput, Button,
  Stack, Badge, Modal, Textarea, Center,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'

const STORAGE_KEY = 'kanban:data'

interface Card {
  id: string
  title: string
  description?: string
}

interface Column {
  id: string
  title: string
  cards: Card[]
}

interface BoardData {
  columns: Column[]
}

function loadBoard(): BoardData {
  return getStorage().get<BoardData>(STORAGE_KEY) ?? {
    columns: [
      { id: 'todo', title: 'Todo', cards: [] },
      { id: 'in-progress', title: 'In Progress', cards: [] },
      { id: 'done', title: 'Done', cards: [] },
    ],
  }
}

function SortableCard({ card, onEdit, onDelete }: { card: Card; onEdit: (c: Card) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      p="sm"
      radius="md"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={500} style={{ flex: 1 }}>{card.title}</Text>
        <Group gap={4} wrap="nowrap">
          <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onEdit(card) }} aria-label="Edit">
            <Icon icon="lucide:pen" width={12} />
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} aria-label="Delete">
            <Icon icon="lucide:trash-2" width={12} />
          </ActionIcon>
        </Group>
      </Group>
      {card.description && (
        <Text size="xs" c="dimmed" lineClamp={2} mt={4}>{card.description}</Text>
      )}
    </Paper>
  )
}

export default function KanbanApp() {
  const [board, setBoard] = useState<BoardData>(loadBoard)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [editColumnTitle, setEditColumnTitle] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [cardTitle, setCardTitle] = useState('')
  const [cardDesc, setCardDesc] = useState('')
  const [cardColumn, setCardColumn] = useState('')

  const saveBoard = useCallback(() => {
    getStorage().set(STORAGE_KEY, board)
  }, [board])

  useEffect(() => { saveBoard() }, [board, saveBoard])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const addColumn = useCallback(() => {
    const title = newColumnTitle.trim()
    if (!title) return
    setBoard((prev) => ({
      columns: [...prev.columns, { id: generateId(), title, cards: [] }],
    }))
    setNewColumnTitle('')
  }, [newColumnTitle])

  const renameColumn = useCallback((id: string, title: string) => {
    setBoard((prev) => ({
      columns: prev.columns.map((c) => (c.id === id ? { ...c, title } : c)),
    }))
    setEditingColumn(null)
  }, [])

  const deleteColumn = useCallback((id: string) => {
    if (!window.confirm('Delete this column and all its cards?')) return
    setBoard((prev) => ({
      columns: prev.columns.filter((c) => c.id !== id),
    }))
  }, [])

  const openNewCard = useCallback((columnId: string) => {
    setEditingCard(null)
    setCardTitle('')
    setCardDesc('')
    setCardColumn(columnId)
    setModalOpen(true)
  }, [])

  const openEditCard = useCallback((card: Card) => {
    setEditingCard(card)
    setCardTitle(card.title)
    setCardDesc(card.description ?? '')
    setCardColumn('')
    setModalOpen(true)
  }, [])

  const saveCard = useCallback(() => {
    if (!cardTitle.trim()) return
    setBoard((prev) => {
      if (editingCard) {
        return {
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === editingCard.id ? { ...c, title: cardTitle.trim(), description: cardDesc.trim() || undefined } : c
            ),
          })),
        }
      }
      const newCard: Card = { id: generateId(), title: cardTitle.trim(), description: cardDesc.trim() || undefined }
      return {
        columns: prev.columns.map((col) =>
          col.id === cardColumn ? { ...col, cards: [...col.cards, newCard] } : col
        ),
      }
    })
    setModalOpen(false)
  }, [cardTitle, cardDesc, cardColumn, editingCard])

  const deleteCard = useCallback((cardId: string) => {
    if (!window.confirm('Delete this card?')) return
    setBoard((prev) => ({
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const cardId = active.id as string
    const targetId = over.id as string

    setBoard((prev) => {
      let card: Card | undefined
      let sourceColIdx = -1
      for (let i = 0; i < prev.columns.length; i++) {
        const found = prev.columns[i]!.cards.find((c) => c.id === cardId)
        if (found) { card = found; sourceColIdx = i; break }
      }
      if (!card || sourceColIdx === -1) return prev

      let targetColIdx = prev.columns.findIndex((c) => c.id === targetId)
      let targetIndex = -1
      if (targetColIdx === -1) {
        for (let i = 0; i < prev.columns.length; i++) {
          const idx = prev.columns[i]!.cards.findIndex((c) => c.id === targetId)
          if (idx !== -1) { targetColIdx = i; targetIndex = idx; break }
        }
      }
      if (targetColIdx === -1) return prev

      const newColumns = prev.columns.map((col) => ({ ...col, cards: [...col.cards] }))
      newColumns[sourceColIdx]!.cards = newColumns[sourceColIdx]!.cards.filter((c) => c.id !== cardId)
      if (targetIndex === -1) {
        newColumns[targetColIdx]!.cards.push(card)
      } else {
        newColumns[targetColIdx]!.cards.splice(targetIndex, 0, card)
      }
      return { columns: newColumns }
    })
  }, [])

  useHotkeys([
    ['alt + N', () => board.columns[0] && openNewCard(board.columns[0].id)],
  ])

  if (board.columns.length === 0) {
    return (
      <Container size="xl" py="md">
        <Text fw={700} size="lg" mb="md" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Kanban
        </Text>
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No columns yet</Text>
            <TextInput
              placeholder="New column..."
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && addColumn()}
              size="sm"
            />
            <Button size="compact-sm" variant="light" onClick={addColumn}>Add Column</Button>
          </Stack>
        </Center>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Kanban
        </Text>
        <Group gap="xs">
          <TextInput
            placeholder="New column..."
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            size="xs"
          />
          <Button size="compact-xs" variant="light" onClick={addColumn}>+</Button>
        </Group>
      </Group>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Group gap="md" align="flex-start" wrap="nowrap" style={{ overflow: 'auto', paddingBottom: 16 }}>
          {board.columns.map((col) => (
            <KanbanColumn key={col.id} column={col} board={board} openNewCard={openNewCard} openEditCard={openEditCard} deleteCard={deleteCard} deleteColumn={deleteColumn} editingColumn={editingColumn} editColumnTitle={editColumnTitle} setEditingColumn={setEditingColumn} setEditColumnTitle={setEditColumnTitle} renameColumn={renameColumn} />
          ))}
        </Group>
      </DndContext>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCard ? 'Edit Card' : 'New Card'}
        size="sm"
      >
        <TextInput
          label="Title"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.currentTarget.value)}
          mb="sm"
          autoFocus
        />
        <Textarea
          label="Description"
          value={cardDesc}
          onChange={(e) => setCardDesc(e.currentTarget.value)}
          mb="md"
          autosize
          minRows={2}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={saveCard}>Save</Button>
        </Group>
      </Modal>
    </Container>
  )
}

function KanbanColumn({ column, board, openNewCard, openEditCard, deleteCard, deleteColumn, editingColumn, editColumnTitle, setEditingColumn, setEditColumnTitle, renameColumn }: {
  column: Column; board: BoardData; openNewCard: (id: string) => void; openEditCard: (c: Card) => void; deleteCard: (id: string) => void; deleteColumn: (id: string) => void; editingColumn: string | null; editColumnTitle: string; setEditingColumn: (id: string | null) => void; setEditColumnTitle: (v: string) => void; renameColumn: (id: string, title: string) => void
}) {
  const { setNodeRef: setDroppableRef } = useDroppable({ id: column.id })

  return (
    <Paper
      ref={setDroppableRef}
      withBorder
      p="sm"
      radius="md"
      style={{ minWidth: 260, maxWidth: 300, flex: 1 }}
    >
      <Group justify="space-between" mb="sm">
        {editingColumn === column.id ? (
          <TextInput
            value={editColumnTitle}
            onChange={(e) => setEditColumnTitle(e.currentTarget.value)}
            onBlur={() => renameColumn(column.id, editColumnTitle)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') renameColumn(column.id, editColumnTitle)
              if (e.key === 'Escape') setEditingColumn(null)
            }}
            size="xs"
            autoFocus
          />
        ) : (
          <Text
            size="sm"
            fw={600}
            style={{ cursor: 'pointer' }}
            onClick={() => { setEditingColumn(column.id); setEditColumnTitle(column.title) }}
          >
            {column.title}
          </Text>
        )}
        <Group gap={4} wrap="nowrap">
          <Badge size="xs" variant="light">{column.cards.length}</Badge>
          <ActionIcon size="xs" variant="subtle" onClick={() => openNewCard(column.id)} aria-label="Add card">
            <Icon icon="lucide:plus" width={14} />
          </ActionIcon>
          {board.columns.length > 1 && (
            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteColumn(column.id)} aria-label="Delete column">
              <Icon icon="lucide:x" width={12} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <Stack gap="xs">
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={openEditCard}
              onDelete={deleteCard}
            />
          ))}
        </Stack>
      </SortableContext>

      {column.cards.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="sm">No cards</Text>
      )}
    </Paper>
  )
}
