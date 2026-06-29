import { Modal, Stack, Group, Text, Image, Anchor, Badge, Button, ActionIcon, CopyButton, Tooltip, Divider } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Bookmark } from '../types'
import { formatRelativeTime } from '../utils'

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
          <Image src={bookmark.ogImage} alt={bookmark.title} radius="sm" height={160} fit="cover" />
        )}

        <Group gap={6}>
          {bookmark.favicon && <img src={bookmark.favicon} alt="" width={16} height={16} />}
          <Anchor href={bookmark.url} target="_blank" rel="noopener noreferrer" size="sm" lineClamp={1} style={{ flex: 1 }}>
            {bookmark.url.replace(/^https?:\/\//, '')}
          </Anchor>
        </Group>

        <Group gap="xs">
          <Button
            size="compact-sm"
            leftSection={<Icon icon="lucide:external-link" width={14} />}
            component="a"
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open URL
          </Button>
          <CopyButton value={bookmark.url}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy URL'}>
                <Button size="compact-sm" variant="light" leftSection={<Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={14} />} onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
            )}
          </CopyButton>
        </Group>

        {bookmark.description && (
          <Text size="sm" c="dimmed">{bookmark.description}</Text>
        )}

        {bookmark.notes && (
          <div>
            <Text size="xs" fw={600} c="dimmed" mb={2}>Notes</Text>
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

        <Divider />

        <Group gap="lg">
          {collectionName && (
            <Text size="xs" c="dimmed">Collection: {collectionName}</Text>
          )}
          <Text size="xs" c="dimmed">Created {formatRelativeTime(bookmark.createdAt)}</Text>
          <Text size="xs" c="dimmed">Updated {formatRelativeTime(bookmark.updatedAt)}</Text>
        </Group>

        <Group gap={4}>
          <ActionIcon size="sm" variant="subtle" onClick={() => onToggleFavorite(bookmark.id)} title="Toggle favorite">
            <Icon icon="lucide:star" width={16} color={bookmark.isFavorite ? 'var(--mantine-color-yellow-5)' : undefined} />
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
