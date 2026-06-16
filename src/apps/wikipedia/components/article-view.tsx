import { useQuery } from '@tanstack/react-query'
import {
  Text, Group, ActionIcon, Loader, Center,
  Anchor, Paper, Stack, Badge, Tooltip,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { fetchPage } from '../utils'
import { useWikipediaStore, useWikipediaSelectedId, useWikipediaAddToHistory } from '../wikipedia-store'
import { useEffect } from 'react'

export function ArticleView() {
  const selectedId = useWikipediaSelectedId()
  const addToHistory = useWikipediaAddToHistory()
  const { bookmarks, goBack, addBookmark, removeBookmark } = useWikipediaStore()

  const pageQuery = useQuery({
    queryKey: ['wiki-page', selectedId],
    queryFn: ({ signal }) => fetchPage(selectedId!, signal),
    enabled: selectedId !== null,
    staleTime: 1000 * 60 * 5,
  })

  const page = pageQuery.data
  const isBookmarked = page ? bookmarks.some((b) => b.pageid === page.pageid) : false

  useEffect(() => {
    if (page) {
      addToHistory(page.pageid, page.title)
    }
  }, [page, addToHistory])

  const handleToggleBookmark = () => {
    if (!page) return
    if (isBookmarked) {
      removeBookmark(page.pageid)
    } else {
      addBookmark(page.pageid, page.title, page.thumbnail?.source)
    }
  }

  return (
    <>
      <Group mb="md" justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={goBack} aria-label="Back to search">
            <Icon icon="lucide:arrow-left" width={20} />
          </ActionIcon>
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }} truncate="end">
            {page?.title ?? 'Loading...'}
          </Text>
        </Group>
        {page && (
          <Tooltip label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
            <ActionIcon
              variant={isBookmarked ? 'filled' : 'subtle'}
              color={isBookmarked ? 'yellow' : 'gray'}
              onClick={handleToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Icon icon={isBookmarked ? 'lucide:bookmark' : 'lucide:bookmark-plus'} width={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {pageQuery.isLoading && (
        <Center py="xl"><Loader /></Center>
      )}

      {pageQuery.isError && (
        <Paper p="md" withBorder>
          <Group gap="xs">
            <Icon icon="lucide:alert-circle" width={16} />
            <Text size="sm">Failed to load article.</Text>
          </Group>
        </Paper>
      )}

      {page && (
        <Stack gap="md">
          {page.thumbnail && (
            <img
              src={page.thumbnail.source}
              alt={page.title}
              style={{
                width: '100%', maxHeight: 300, objectFit: 'cover',
                borderRadius: 'var(--mantine-radius-md)',
              }}
            />
          )}

          <Text size="sm" style={{ lineHeight: 1.7 }}>
            {page.extract ?? 'No content available.'}
          </Text>

          {page.categories && page.categories.length > 0 && (
            <div>
              <Text size="xs" fw={600} mb={4} c="dimmed">Categories</Text>
              <Group gap={4}>
                {page.categories.map((cat) => (
                  <Badge key={cat.title} variant="outline" size="sm">
                    {cat.title}
                  </Badge>
                ))}
              </Group>
            </div>
          )}

          {page.related && page.related.length > 0 && (
            <div>
              <Text size="xs" fw={600} mb={4} c="dimmed">Related Articles</Text>
              <Stack gap={4}>
                {page.related.map((link) => (
                  <Text
                    key={link.pageid}
                    size="sm"
                    c="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      useWikipediaStore.getState().selectArticle(link.pageid)
                      window.scrollTo({ top: 0 })
                    }}
                  >
                    {link.title}
                  </Text>
                ))}
              </Stack>
            </div>
          )}

          <Anchor
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title).replace(/%20/g, '_')}`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            <Group gap={4}>
              <Icon icon="lucide:external-link" width={14} />
              Read full article on Wikipedia
            </Group>
          </Anchor>
        </Stack>
      )}
    </>
  )
}
