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
      <Stack align="center" gap="md" py="lg">
        <Icon icon="lucide:bookmark" width={36} color="var(--mantine-color-dimmed)" />
        <div>
          <Text size="sm" c="dimmed" ta="center">No bookmarks yet</Text>
          <Text size="xs" c="dimmed" ta="center" mt={2}>Save pages from any browser</Text>
        </div>
        <Button size="compact-sm" variant="light" onClick={() => navigate('/bookmarks')}>
          Open bookmarks
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={0}>
      {entries.map((entry) => (
        <Group
          key={entry.id}
          gap="sm"
          wrap="nowrap"
          py={8}
          px="sm"
          style={{
            cursor: 'pointer',
            borderRadius: 'var(--mantine-radius-sm)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          onClick={() => window.open(entry.url, '_blank')}
        >
          {entry.favicon ? (
            <img src={entry.favicon} alt="" width={14} height={14} style={{ flexShrink: 0, borderRadius: 2 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <Icon icon="lucide:link" width={14} style={{ flexShrink: 0 }} color="var(--mantine-color-dimmed)" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap={4} align="center">
              <Text size="sm" fw={500} lineClamp={1}>{entry.title}</Text>
              {entry.isFavorite && <Icon icon="lucide:star" width={10} color="var(--mantine-color-yellow-5)" style={{ flexShrink: 0 }} />}
              {entry.isReadLater && <Icon icon="lucide:bookmark-plus" width={10} color="var(--mantine-color-blue-5)" style={{ flexShrink: 0 }} />}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={1}>{entry.url.replace(/^https?:\/\//, '')}</Text>
          </div>
        </Group>
      ))}
      <Button
        size="compact-xs"
        variant="light"
        onClick={() => navigate('/bookmarks')}
        fullWidth
        mt="xs"
      >
        {total > 5 ? `View all ${total} bookmarks` : 'Open bookmarks'}
      </Button>
    </Stack>
  )
}
