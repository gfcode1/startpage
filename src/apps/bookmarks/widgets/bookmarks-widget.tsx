import { Stack, Group, Text, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useRecentBookmarks, useBookmarks } from '../store'
import { useNavigate } from 'react-router-dom'

export default function BookmarksWidget() {
  const entries = useRecentBookmarks(5)
  const total = useBookmarks().length
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <Stack align="center" gap="xs" py="md">
        <Icon icon="lucide:bookmark" width={24} color="var(--mantine-color-dimmed)" />
        <Text size="xs" c="dimmed">No bookmarks yet</Text>
        <Button size="compact-xs" variant="light" onClick={() => navigate('/bookmarks')}>
          Open bookmarks
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      {entries.map((entry) => (
        <Group key={entry.id} gap="sm" wrap="nowrap">
          {entry.favicon ? (
            <img src={entry.favicon} alt="" width={14} height={14} style={{ flexShrink: 0 }} />
          ) : (
            <Icon icon="lucide:link" width={14} style={{ flexShrink: 0 }} color="var(--mantine-color-dimmed)" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap={4} align="center">
              <Text size="sm" fw={600} lineClamp={1}>{entry.title}</Text>
              {entry.isFavorite && <Icon icon="lucide:star" width={10} color="var(--mantine-color-yellow-5)" />}
              {entry.isReadLater && <Icon icon="lucide:bookmark-plus" width={10} color="var(--mantine-color-blue-5)" />}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={1}>{entry.url.replace(/^https?:\/\//, '')}</Text>
          </div>
        </Group>
      ))}
      <Button size="compact-xs" variant="light" onClick={() => navigate('/bookmarks')} fullWidth>
        {total > 5 ? `View all ${total} bookmarks` : 'Open bookmarks'}
      </Button>
    </Stack>
  )
}
