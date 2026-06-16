import { Paper, Group, Text, Image, ActionIcon, Stack } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Bookmark } from '../types'

interface BookmarkCardProps {
  bookmark: Bookmark
  collectionName?: string
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkCard({
  bookmark,
  collectionName: _collectionName,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkCardProps) {
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => onOpen(bookmark.id)}
    >
      <Stack gap={8}>
        {bookmark.ogImage ? (
          <Image
            src={bookmark.ogImage}
            alt={bookmark.title}
            height={100}
            radius="sm"
            fit="cover"
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E"
          />
        ) : (
          <Group justify="center" py="lg">
            <Icon icon="lucide:link" width={32} color="var(--mantine-color-dimmed)" />
          </Group>
        )}

        <div style={{ minWidth: 0 }}>
          <Group gap={6} align="center" mb={2}>
            {bookmark.favicon && (
              <img src={bookmark.favicon} alt="" width={14} height={14} style={{ flexShrink: 0 }} />
            )}
            <Text size="sm" fw={600} lineClamp={1}>{bookmark.title}</Text>
          </Group>
          {bookmark.description && (
            <Text size="xs" c="dimmed" lineClamp={2}>{bookmark.description}</Text>
          )}
          <Text size="xs" c="gray" lineClamp={1} style={{ wordBreak: 'break-all' }}>
            {bookmark.url.replace(/^https?:\/\//, '')}
          </Text>
        </div>

        <Group gap={4} justify="flex-end">
          {bookmark.isFavorite && <Icon icon="lucide:star" width={12} color="var(--mantine-color-yellow-5)" />}
          {bookmark.isReadLater && <Icon icon="lucide:bookmark-plus" width={12} color="var(--mantine-color-blue-5)" />}
          {bookmark.tags.length > 0 && (
            <Text size="xs" c="dimmed">{bookmark.tags.length} tags</Text>
          )}
        </Group>

        <Group gap={4} justify="flex-end" onClick={(e) => e.stopPropagation()}>
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleFavorite(bookmark.id)} title="Toggle favorite">
            <Icon icon={bookmark.isFavorite ? 'lucide:star' : 'lucide:star'} width={14} color={bookmark.isFavorite ? 'var(--mantine-color-yellow-5)' : undefined} />
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
      </Stack>
    </Paper>
  )
}
