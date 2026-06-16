import { useEffect, useState } from 'react'
import { Container, Text, Group, ActionIcon, Tooltip, Loader, Center, Alert } from '@mantine/core'
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
  const articles = useNewsStore((s) => s.articles)

  const [catalogOpen, setCatalogOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    init()
    setInitialized(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [init])

  const hasFeeds = enabledFeedIds.length > 0 || customFeeds.length > 0
  const hasContent = hasFeeds && Object.values(articles).some((c) => c.items.length > 0)

  useEffect(() => {
    if (initialized && hasFeeds && !hasContent) {
      refreshAllFeeds()
    }
  }, [initialized, hasFeeds, hasContent, refreshAllFeeds])

  useHotkeys([
    ['alt+N', () => setCatalogOpen(true)],
    ['Escape', () => { if (activeArticle) setActiveArticle(null) }],
    ['mod+B', () => setShowBookmarksOnly(!showBookmarksOnly)],
    ['mod+G', () => setViewMode(viewMode === 'grid' ? 'list' : 'grid')],
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

      <FeedManager />
      <CategoryNav />

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
