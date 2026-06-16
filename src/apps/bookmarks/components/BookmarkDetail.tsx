import { Modal, Stack, Group, Text, Image, Anchor, Badge, Button, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Bookmark } from '../types'

interface BookmarkDetailProps {
  bookmark: Bookmark | null
  collectionName?: string
  opened: boolean
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleReadLater: (id: string) => void
}

export default function BookmarkDetail({
  bookmark,
  collectionName,
  opened,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReadLater,
}: BookmarkDetailProps) {
  if (!bookmark) return null

  return (
    <Modal opened={opened} onClose={onClose} title={bookmark.title} size="md">
      <Stack>
        {bookmark.ogImage && (
          <Image src={bookmark.ogImage} alt={bookmark.title} radius="sm" fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E" />
        )}

        <Group gap={6}>
          {bookmark.favicon && <img src={bookmark.favicon} alt="" width={16} height={16} />}
          <Anchor href={bookmark.url} target="_blank" rel="noopener noreferrer" size="sm">
            {bookmark.url.replace(/^https?:\/\//, '')}
          </Anchor>
        </Group>

        {bookmark.description && (
          <Text size="sm" c="dimmed">{bookmark.description}</Text>
        )}

        {bookmark.notes && (
          <div>
            <Text size="xs" fw={600} c="dimmed">Notes</Text>
            <Text size="sm">{bookmark.notes}</Text>
          </div>
        )}

        {bookmark.tags.length > 0 && (
          <Group gap={4}>
            {bookmark.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="light">{tag}</Badge>
            ))}
          </Group>
        )}

        {collectionName && (
          <Text size="xs" c="dimmed">Collection: {collectionName}</Text>
        )}

        <Group gap={4}>
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleFavorite(bookmark.id)} title="Toggle favorite">
            <Icon icon={bookmark.isFavorite ? 'lucide:star' : 'lucide:star'} width={16} color={bookmark.isFavorite ? 'var(--mantine-color-yellow-5)' : undefined} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleReadLater(bookmark.id)} title="Toggle read later">
            <Icon icon={bookmark.isReadLater ? 'lucide:bookmark-check' : 'lucide:bookmark-plus'} width={16} />
          </ActionIcon>
          <Button size="compact-sm" variant="light" onClick={() => { onEdit(bookmark.id); onClose() }}>
            Edit
          </Button>
          <Button size="compact-sm" variant="light" color="red" onClick={() => { onDelete(bookmark.id); onClose() }}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
