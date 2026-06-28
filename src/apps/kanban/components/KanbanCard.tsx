import { memo, useMemo } from 'react'
import { Text, Paper, Group, ActionIcon, Badge } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { marked } from 'marked'
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
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDetail: (c: Card) => void
}

function markdownToText(md: string): string {
  const html = marked.parseInline(md) as string
  return html.replace(/<\/?(?:p|br|div)\b[^>]*>/g, '').trim()
}

export const KanbanCard = memo(function KanbanCard({
  card, onEdit, onDelete, onDuplicate, onArchive, onRestore, onDetail,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: card.archived,
  })

  const isOverdue = card.dueDate !== null && card.dueDate < Date.now()

  const renderedDesc = useMemo(() => {
    if (!card.description) return null
    return markdownToText(card.description)
  }, [card.description])

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      p="sm"
      radius="md"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: card.archived ? 0.55 : isDragging ? 0.4 : 1,
        cursor: card.archived ? 'default' : 'grab',
        borderLeft: card.archived
          ? '3px solid var(--mantine-color-gray-5)'
          : `3px solid var(--mantine-color-${PRIORITY_CONFIG[card.priority].color}-5)`,
      }}
      {...(!card.archived && attributes)}
      {...(!card.archived && listeners)}
      onClick={() => !card.archived && onDetail(card)}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text size="sm" fw={500} style={{ flex: 1 }}>{card.title}</Text>
        <Group gap={4} wrap="nowrap">
          {!card.archived ? (
            <>
              <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onEdit(card) }} aria-label="Edit card">
                <Icon icon="lucide:pen" width={12} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onDuplicate(card.id) }} aria-label="Duplicate card">
                <Icon icon="lucide:copy" width={12} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onArchive(card.id) }} aria-label="Archive card">
                <Icon icon="lucide:archive" width={12} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} aria-label="Delete card">
                <Icon icon="lucide:trash-2" width={12} />
              </ActionIcon>
            </>
          ) : (
            <>
              <Badge size="xs" color="gray" variant="light">Archived</Badge>
              <ActionIcon size="xs" variant="subtle" color="green" onClick={(e) => { e.stopPropagation(); onRestore(card.id) }} aria-label="Restore card">
                <Icon icon="lucide:undo-2" width={12} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} aria-label="Delete card">
                <Icon icon="lucide:trash-2" width={12} />
              </ActionIcon>
            </>
          )}
        </Group>
      </Group>

      {renderedDesc && (
        <Text size="xs" c="dimmed" lineClamp={2} mb={4}>{renderedDesc}</Text>
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
