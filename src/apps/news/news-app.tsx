import { useEffect, useState } from 'react'
import { Container, Text, Group, ActionIcon, Tooltip, Loader, Center, Alert, Badge, NativeSelect } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import { useNewsStore } from '@/stores/news-store'
import { FeedSelector } from './components/feed-selector'
import { FeedManager } from './components/feed-manager'
import { CategoryNav } from './components/category-nav'
import { SearchBar } from './components/search-bar'
import { ArticleGrid } from './components/article-grid'
import { ArticleReader } from './components/article-reader'

export default function NewsApp() {
  const init = useNewsStore((s) => s.init)
  const activeArticle = useNewsStore((s) => s.activeArticle)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const refreshAllFeeds = useNewsStore((s) => s.refreshAllFeeds)
  const isRefreshing = useNewsStore((s) => s.isRefreshing)
  const feedErrors = useNewsStore((s) => s.feedErrors)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const viewMode = useNewsStore((s) => s.viewMode)
  const setViewMode = useNewsStore((s) => s.setViewMode)
  const showBookmarksOnly = useNewsStore((s) => s.showBookmarksOnly)
  const setShowBookmarksOnly = useNewsStore((s) => s.setShowBookmarksOnly)
  const showUnreadOnly = useNewsStore((s) => s.showUnreadOnly)
  const setShowUnreadOnly = useNewsStore((s) => s.setShowUnreadOnly)
  const sortBy = useNewsStore((s) => s.sortBy)
  const setSortBy = useNewsStore((s) => s.setSortBy)
  const markAllRead = useNewsStore((s) => s.markAllRead)
  const getUnreadCount = useNewsStore((s) => s.getUnreadCount)
  const autoRefreshInterval = useNewsStore((s) => s.autoRefreshInterval)
  const setAutoRefreshInterval = useNewsStore((s) => s.setAutoRefreshInterval)
  const retentionDays = useNewsStore((s) => s.retentionDays)
  const setRetentionDays = useNewsStore((s) => s.setRetentionDays)
  const getRefreshIntervalMs = useNewsStore((s) => s.getRefreshIntervalMs)
  const hasContent = useNewsStore((s) => {
    const ids = [...s.enabledFeedIds, ...s.customFeeds.map((f) => f.id)]
    return ids.some((id) => (s.articles[id]?.items.length ?? 0) > 0)
  })

  const [catalogOpen, setCatalogOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    init()
    setInitialized(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [init])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const hasFeeds = enabledFeedIds.length > 0 || customFeeds.length > 0
  const needsInitialFetch = hasFeeds && !hasContent

  useEffect(() => {
    if (initialized && needsInitialFetch) {
      refreshAllFeeds()
    }
  }, [initialized, needsInitialFetch, refreshAllFeeds])

  useEffect(() => {
    const ms = getRefreshIntervalMs()
    if (!ms || !initialized) return
    const timer = setInterval(() => refreshAllFeeds(), ms)
    return () => clearInterval(timer)
  }, [autoRefreshInterval, initialized, refreshAllFeeds, getRefreshIntervalMs])

  const unreadCount = getUnreadCount()

  useHotkeys([
    ['alt+N', () => setCatalogOpen(true)],
    ['Escape', () => { if (activeArticle) setActiveArticle(null) }],
    ['mod+B', () => setShowBookmarksOnly(!showBookmarksOnly)],
    ['mod+I', () => setShowUnreadOnly(!showUnreadOnly)],
    ['mod+G', () => setViewMode(viewMode === 'grid' ? 'list' : 'grid')],
    ['mod+U', () => markAllRead()],
  ])

  if (!initialized) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (activeArticle) {
    return <ArticleReader />
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Icon icon="lucide:rss" width={22} />
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            News
          </Text>
        </Group>

        <Group gap="xs">
          <SearchBar />

          {unreadCount > 0 && (
            <Badge size="sm" variant="filled" color="accent" style={{ fontWeight: 600 }}>
              {unreadCount} unread
            </Badge>
          )}

          <Tooltip label="Feed catalog (Alt+N)">
            <ActionIcon
              variant="light"
              size="md"
              onClick={() => setCatalogOpen(true)}
            >
              <Icon icon="lucide:list-plus" width={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={showBookmarksOnly ? 'Show all' : 'Bookmarks (⌘B)'}>
            <ActionIcon
              variant={showBookmarksOnly ? 'filled' : 'subtle'}
              size="md"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            >
              <Icon icon="lucide:bookmark" width={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={showUnreadOnly ? 'Show all' : 'Unread only (⌘I)'}>
            <ActionIcon
              variant={showUnreadOnly ? 'filled' : 'subtle'}
              size="md"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              <Icon icon="lucide:eye" width={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={viewMode === 'grid' ? 'List view (⌘G)' : 'Grid view (⌘G)'}>
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Icon
                icon={viewMode === 'grid' ? 'lucide:list' : 'lucide:layout-grid'}
                width={18}
              />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Mark all read (⌘U)">
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={() => markAllRead()}
            >
              <Icon icon="lucide:check-check" width={18} />
            </ActionIcon>
          </Tooltip>

          {hasFeeds && (
            <Tooltip label="Refresh all">
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={() => refreshAllFeeds()}
                loading={isRefreshing}
              >
                <Icon icon="lucide:refresh-cw" width={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Group gap="xs" mb="sm" align="center">
        <FeedManager />
      </Group>
      <Group gap="xs" mb="sm" align="center">
        <CategoryNav />
        <NativeSelect
          size="xs"
          data={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'unread-first', label: 'Unread first' },
          ]}
          value={sortBy}
          onChange={(e) => setSortBy(e.currentTarget.value as 'newest' | 'oldest' | 'unread-first')}
          style={{ maxWidth: 140 }}
        />
        <NativeSelect
          size="xs"
          data={[
            { value: 'off', label: 'Auto: off' },
            { value: '15m', label: 'Auto: 15m' },
            { value: '30m', label: 'Auto: 30m' },
            { value: '1h', label: 'Auto: 1h' },
          ]}
          value={autoRefreshInterval}
          onChange={(e) => setAutoRefreshInterval(e.currentTarget.value as 'off' | '15m' | '30m' | '1h')}
          style={{ maxWidth: 130 }}
        />
        <NativeSelect
          size="xs"
          data={[
            { value: '7', label: 'Keep 7d' },
            { value: '30', label: 'Keep 30d' },
            { value: '90', label: 'Keep 90d' },
          ]}
          value={String(retentionDays)}
          onChange={(e) => setRetentionDays(Number(e.currentTarget.value) as 7 | 30 | 90)}
          style={{ maxWidth: 125 }}
        />
      </Group>

      {feedErrors.length > 0 && (
        <Alert color="red" variant="light" py="xs" my="sm" styles={{ body: { padding: 0 } }}>
          <Text size="xs" c="red">
            Failed: {feedErrors.join(', ')}
          </Text>
        </Alert>
      )}

      <div style={{ marginTop: 12 }}>
        <ArticleGrid />
      </div>

      <FeedSelector opened={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </Container>
  )
}
