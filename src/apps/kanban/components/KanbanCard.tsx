import { memo } from 'react'
import { Text, Paper, Group, ActionIcon, Badge } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card, Priority } from '../types'

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  critical: { color: 'red', label: 'Critical' },
  high: { color: 'orange', label: 'High' },
  medium: { color: 'blue', label: 'Medium' },
  low: { color: 'gray', label: 'Low' },
}

interface KanbanCardProps {
  card: Card
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
  onDetail: (c: Card) => void
}

export const KanbanCard = memo(function KanbanCard({ card, onEdit, onDelete, onDetail }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const isOverdue = card.dueDate !== null && card.dueDate < Date.now()

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
        borderLeft: `3px solid var(--mantine-color-${PRIORITY_CONFIG[card.priority].color}-5)`,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onDetail(card)}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text size="sm" fw={500} style={{ flex: 1 }}>{card.title}</Text>
        <Group gap={4} wrap="nowrap">
          <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onEdit(card) }} aria-label="Edit card">
            <Icon icon="lucide:pen" width={12} />
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} aria-label="Delete card">
            <Icon icon="lucide:trash-2" width={12} />
          </ActionIcon>
        </Group>
      </Group>

      {card.description && (
        <Text size="xs" c="dimmed" lineClamp={2} mb={4}>{card.description}</Text>
      )}

      <Group gap={4} wrap="wrap">
        <Badge size="xs" color={PRIORITY_CONFIG[card.priority].color} variant="light">
          {PRIORITY_CONFIG[card.priority].label}
        </Badge>
        {card.labels.map((label) => (
          <Badge key={label} size="xs" variant="outline" color="gray">
            {label}
          </Badge>
        ))}
        {card.dueDate && (
          <Badge
            size="xs"
            variant="light"
            color={isOverdue ? 'red' : 'green'}
            leftSection={<Icon icon="lucide:calendar" width={10} />}
          >
            {new Date(card.dueDate).toLocaleDateString()}
          </Badge>
        )}
        {card.assignee && (
          <Badge size="xs" variant="filled" color="violet">
            {card.assignee}
          </Badge>
        )}
      </Group>
    </Paper>
  )
})
