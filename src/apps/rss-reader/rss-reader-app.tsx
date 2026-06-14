import { useState, useCallback, useMemo } from 'react'
import {
  Container, Text, Group, Paper, TextInput, Button, ActionIcon,
  Loader, Center, Badge,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { useHotkeys } from '@mantine/hooks'
import { getStorage } from '@/lib/storage/engine'

const STORAGE_KEY = 'rss:feeds'

interface FeedItem {
  title: string
  link: string
  pubDate: string
  contentSnippet?: string
}

interface Feed {
  url: string
  title: string
  items: FeedItem[]
}

function loadFeeds(): string[] {
  return getStorage().get<string[]>(STORAGE_KEY) ?? []
}

function saveFeeds(feeds: string[]) {
  getStorage().set(STORAGE_KEY, feeds)
}

async function fetchFeed(url: string): Promise<Feed> {
  const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`
  const res = await fetch(proxy)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return {
    url,
    title: data.title ?? url,
    items: (data.items ?? []).map((item: Record<string, string>) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.description?.replace(/<[^>]*>/g, '').slice(0, 200),
    })),
  }
}

const MAX_VISIBLE_ITEMS = 50

function safeDate(d: string): number {
  const t = new Date(d).getTime()
  return Number.isNaN(t) ? 0 : t
}

export default function RssReaderApp() {
  const [feedUrls, setFeedUrls] = useState<string[]>(loadFeeds)
  const [newUrl, setNewUrl] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; link: string } | null>(null)
  const [feedErrors, setFeedErrors] = useState<string[]>([])

  const addFeed = useCallback(() => {
    const url = newUrl.trim()
    if (!url) return
    if (feedUrls.includes(url)) return
    const updated = [...feedUrls, url]
    setFeedUrls(updated)
    saveFeeds(updated)
    setNewUrl('')
  }, [newUrl, feedUrls])

  const removeFeed = useCallback((url: string) => {
    if (!window.confirm(`Remove feed: ${url.slice(0, 40)}?`)) return
    const updated = feedUrls.filter((u) => u !== url)
    setFeedUrls(updated)
    saveFeeds(updated)
  }, [feedUrls])

  const feedsQuery = useQuery({
    queryKey: ['rss-feeds', feedUrls],
    queryFn: async () => {
      const results = await Promise.allSettled(feedUrls.map(fetchFeed))
      const errors: string[] = []
      const feeds: Feed[] = []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]!
        if (r.status === 'fulfilled') {
          feeds.push(r.value)
        } else {
          errors.push(feedUrls[i] ?? 'unknown')
        }
      }
      setFeedErrors(errors)
      return feeds
    },
    enabled: feedUrls.length > 0,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 15,
  })

  useHotkeys([
    ['alt + N', () => setNewUrl('')],
  ])

  const allItems = useMemo(() => (feedsQuery.data ?? [])
    .flatMap((feed) =>
      feed.items.map((item) => ({ ...item, feedTitle: feed.title }))
    )
    .sort((a, b) => safeDate(b.pubDate) - safeDate(a.pubDate)), [feedsQuery.data])

  if (selectedArticle) {
    return (
      <Container size="xl" py="md">
        <Group mb="md">
          <ActionIcon variant="subtle" onClick={() => setSelectedArticle(null)} aria-label="Back">
            <Icon icon="lucide:arrow-left" width={20} />
          </ActionIcon>
          <Text fw={700} style={{ fontFamily: 'Space Grotesk, sans-serif' }} truncate="end">
            {selectedArticle.title}
          </Text>
        </Group>
        <iframe
          src={selectedArticle.link}
          style={{ width: '100%', height: '80vh', border: 'none', borderRadius: 8 }}
          title={selectedArticle.title}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      <Text fw={700} size="lg" mb="md" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        RSS Reader
      </Text>

      <form onSubmit={(e) => { e.preventDefault(); addFeed() }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TextInput
          placeholder="Add RSS feed URL..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.currentTarget.value)}
          style={{ flex: 1 }}
          leftSection={<Icon icon="lucide:rss" width={16} />}
        />
        <Button type="submit" variant="light">Add</Button>
      </form>

      <Group gap="xs" mb="md">
        {feedUrls.length > 0 && (
          <>
            {feedUrls.map((url) => (
              <Badge
                key={url}
                variant="outline"
                rightSection={
                  <ActionIcon size="xs" variant="transparent" onClick={() => removeFeed(url)}>
                    <Icon icon="lucide:x" width={10} />
                  </ActionIcon>
                }
              >
                {url.slice(0, 30)}...
              </Badge>
            ))}
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => feedsQuery.refetch()}
              loading={feedsQuery.isFetching}
              aria-label="Refresh feeds"
            >
              <Icon icon="lucide:refresh-cw" width={14} />
            </ActionIcon>
          </>
        )}
      </Group>

      {feedErrors.length > 0 && (
        <Text size="xs" c="red" mb="md">
          Failed to load: {feedErrors.map((u) => new URL(u).hostname).join(', ')}
        </Text>
      )}

      {feedsQuery.isLoading && (
        <Center py="xl"><Loader /></Center>
      )}

      {allItems.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
        <Paper
          key={item.link}
          withBorder
          p="sm"
          mb="xs"
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedArticle({ title: item.title, link: item.link })}
        >
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={600} truncate="end" style={{ flex: 1 }}>
              {item.title}
            </Text>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              {new Date(item.pubDate).toLocaleDateString()}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {item.contentSnippet}
          </Text>
          <Text size="xs" c="accent" mt={4}>{item.feedTitle}</Text>
        </Paper>
      ))}

      {!feedsQuery.isLoading && feedUrls.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">Add an RSS feed URL above to get started.</Text>
      )}
    </Container>
  )
}
