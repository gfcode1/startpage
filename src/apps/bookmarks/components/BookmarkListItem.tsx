import { Group, Text, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Bookmark } from '../types'
import { formatRelativeTime } from '../utils'

interface BookmarkListItemProps {
  bookmark: Bookmark
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkListItem({
  bookmark,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkListItemProps) {
  return (
    <Group
      gap="sm"
      wrap="nowrap"
      py={8}
      px="sm"
      bg="var(--mantine-color-body)"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--mantine-color-body)' }}
      onClick={() => onOpen(bookmark.id)}
    >
      {bookmark.favicon ? (
        <img src={bookmark.favicon} alt="" width={16} height={16} style={{ flexShrink: 0, borderRadius: 2 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <Icon icon="lucide:link" width={16} style={{ flexShrink: 0 }} color="var(--mantine-color-dimmed)" />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} align="center">
          <Text size="sm" fw={500} lineClamp={1}>{bookmark.title}</Text>
          {bookmark.isFavorite && <Icon icon="lucide:star" width={10} color="var(--mantine-color-yellow-5)" style={{ flexShrink: 0 }} />}
          {bookmark.isReadLater && <Icon icon="lucide:bookmark-plus" width={10} color="var(--mantine-color-blue-5)" style={{ flexShrink: 0 }} />}
        </Group>
        <Group gap="lg">
          <Text size="xs" c="dimmed" lineClamp={1} style={{ flex: 1 }}>{bookmark.url.replace(/^https?:\/\//, '')}</Text>
          <Text size="xs" c="gray" style={{ flexShrink: 0 }}>{formatRelativeTime(bookmark.createdAt)}</Text>
        </Group>
      </div>

      <Group gap={2} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
        <ActionIcon size="sm" variant="subtle" onClick={() => onToggleFavorite(bookmark.id)} title="Toggle favorite">
          <Icon icon="lucide:star" width={14} color={bookmark.isFavorite ? 'var(--mantine-color-yellow-5)' : undefined} />
        </ActionIcon>
        <ActionIcon size="sm" variant="subtle" onClick={() => onToggleReadLater(bookmark.id)} title="Toggle read later">
          <Icon icon={bookmark.isReadLater ? 'lucide:bookmark-check' : 'lucide:bookmark-plus'} width={14} />
        </ActionIcon>
        <ActionIcon size="sm" variant="subtle" onClick={() => onEdit(bookmark.id)} title="Edit">
          <Icon icon="lucide:pencil" width={14} />
        </ActionIcon>
        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(bookmark.id)} title="Delete">
          <Icon icon="lucide:trash-2" width={14} />
        </ActionIcon>
      </Group>
    </Group>
  )
}
