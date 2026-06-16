import { Text, Paper, Group, ActionIcon, Stack, Center } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useWikipediaBookmarks, useWikipediaRemoveBookmark, useWikipediaSelectArticle } from '../wikipedia-store'

export function BookmarksView() {
  const bookmarks = useWikipediaBookmarks()
  const removeBookmark = useWikipediaRemoveBookmark()
  const selectArticle = useWikipediaSelectArticle()

  if (bookmarks.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="xs">
          <Icon icon="lucide:bookmark" width={32} />
          <Text size="sm" c="dimmed">No bookmarks yet.</Text>
          <Text size="xs" c="dimmed">Save articles while browsing to see them here.</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap={4}>
      {bookmarks.map((bookmark) => (
        <Paper
          key={bookmark.id}
          withBorder
          p="sm"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            selectArticle(bookmark.pageid)
            window.scrollTo({ top: 0 })
          }}
        >
          <Group gap="sm" wrap="nowrap">
            {bookmark.thumbnail && (
              <img
                src={bookmark.thumbnail}
                alt=""
                style={{
                  width: 40, height: 40, objectFit: 'cover',
                  borderRadius: 'var(--mantine-radius-sm)', flexShrink: 0,
                }}
              />
            )}
            <Text size="sm" fw={500} style={{ flex: 1 }} truncate="end">
              {bookmark.title}
            </Text>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                removeBookmark(bookmark.pageid)
              }}
              aria-label="Remove bookmark"
            >
              <Icon icon="lucide:trash-2" width={14} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
