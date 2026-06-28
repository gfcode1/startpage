import { useState, useMemo } from 'react'
import { Text, Paper, Group, ActionIcon, Badge, TextInput, Stack, Menu } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column, Card, SortBy } from '../types'
import { useKanbanSearchQuery, useKanbanFilter, useKanbanSetColumnSort } from '@/stores/kanban-store'
import { sortCards } from '../utils'
import { KanbanCard } from './KanbanCard'
import { useMediaQuery } from '@mantine/hooks'

interface KanbanColumnProps {
  column: Column
  columnCount: number
  showArchived: boolean
  onAddCard: (columnId: string) => void
  onEditCard: (card: Card) => void
  onDeleteCard: (id: string) => void
  onDuplicateCard: (id: string) => void
  onArchiveCard: (id: string) => void
  onRestoreCard: (id: string) => void
  onDetailCard: (card: Card) => void
  onRenameColumn: (id: string, title: string) => void
  onDeleteColumn: (id: string) => void
}

const SORT_OPTIONS: { value: SortBy; label: string; icon: string }[] = [
  { value: 'manual', label: 'Manual', icon: 'lucide:grip-vertical' },
  { value: 'priority', label: 'Priority', icon: 'lucide:alert-circle' },
  { value: 'dueDate', label: 'Due date', icon: 'lucide:calendar' },
  { value: 'title', label: 'Title', icon: 'lucide:arrow-up-a-z' },
  { value: 'createdAt', label: 'Created', icon: 'lucide:clock' },
]

export function KanbanColumn({
  column, columnCount, showArchived,
  onAddCard, onEditCard, onDeleteCard, onDuplicateCard,
  onArchiveCard, onRestoreCard, onDetailCard,
  onRenameColumn, onDeleteColumn,
}: KanbanColumnProps) {
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(column.title)
  const searchQuery = useKanbanSearchQuery()
  const filter = useKanbanFilter()
  const setColumnSort = useKanbanSetColumnSort()
  const [parent] = useAutoAnimate()
  const isMobile = useMediaQuery('(max-width: 47.999em)')

  const sortedCards = useMemo(() => {
    let result = column.cards

    if (!showArchived) {
      result = result.filter((c) => !c.archived)
    }

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

    return sortCards(result, column.sortBy)
  }, [column.cards, column.sortBy, searchQuery, filter, showArchived])

  const { setNodeRef: setDroppableRef } = useDroppable({ id: `col-drop:${column.id}` })

  const handleRename = () => {
    onRenameColumn(column.id, editName)
    setEditingName(false)
  }

  const activeCardCount = column.cards.filter((c) => !c.archived).length
  const archivedCount = column.cards.filter((c) => c.archived).length

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        minWidth: isMobile ? undefined : 280,
        maxWidth: isMobile ? undefined : 320,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile ? undefined : 'calc(100vh - 140px)',
      }}
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
          <Badge size="xs" variant="light">{activeCardCount}</Badge>
          {archivedCount > 0 && (
            <Badge size="xs" variant="light" color="gray">+{archivedCount}</Badge>
          )}
          <Menu shadow="md" width={160}>
            <Menu.Target>
              <ActionIcon size="xs" variant="subtle" title="Sort by" aria-label="Sort column">
                <Icon icon="lucide:arrow-up-down" width={12} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {SORT_OPTIONS.map((opt) => (
                <Menu.Item
                  key={opt.value}
                  onClick={() => setColumnSort(column.id, opt.value)}
                  rightSection={column.sortBy === opt.value ? <Icon icon="lucide:check" width={14} /> : null}
                  leftSection={<Icon icon={opt.icon} width={14} />}
                >
                  {opt.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
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
        <SortableContext items={column.cards.filter((c) => !c.archived).map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <Stack gap="xs" ref={parent}>
            {sortedCards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                onDuplicate={onDuplicateCard}
                onArchive={onArchiveCard}
                onRestore={onRestoreCard}
                onDetail={onDetailCard}
              />
            ))}
          </Stack>
        </SortableContext>

        {sortedCards.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" py="sm">No cards</Text>
        )}
      </div>
    </Paper>
  )
}
