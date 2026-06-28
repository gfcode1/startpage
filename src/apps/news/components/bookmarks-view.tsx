import { useMemo } from 'react'
import { SimpleGrid, Center, Text, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { ArticleCard } from './article-card'
import type { NewsArticle } from '../types'

export function BookmarksView() {
  const articles = useNewsStore((s) => s.articles)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const bookmarks = useNewsStore((s) => s.bookmarks)
  const activeArticle = useNewsStore((s) => s.activeArticle)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const toggleBookmark = useNewsStore((s) => s.toggleBookmark)
  const setShowBookmarksOnly = useNewsStore((s) => s.setShowBookmarksOnly)

  const bookmarkedArticles = useMemo(() => {
    const ids = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
    const all: NewsArticle[] = []
    for (const id of ids) {
      const cache = articles[id]
      if (cache) all.push(...cache.items)
    }
    return all
      .filter((a) => bookmarks.includes(a.id))
      .sort((a, b) => b.publishedAt - a.publishedAt)
  }, [articles, enabledFeedIds, customFeeds, bookmarks])

  if (activeArticle) return null

  return (
    <div>
      <Button
        variant="subtle"
        size="sm"
        leftSection={<Icon icon="lucide:arrow-left" width={14} />}
        onClick={() => setShowBookmarksOnly(false)}
        mb="sm"
      >
        All articles
      </Button>

      {bookmarkedArticles.length === 0 ? (
        <Center py="xl">
          <div style={{ textAlign: 'center' }}>
            <Icon icon="lucide:bookmark" width={40} />
            <Text size="sm" c="dimmed" mt="sm">No bookmarked articles</Text>
            <Text size="xs" c="dimmed">Bookmark articles to read them later</Text>
          </div>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {bookmarkedArticles.map((article: NewsArticle) => (
            <ArticleCard
              key={article.id}
              article={article}
              onSelect={setActiveArticle}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </SimpleGrid>
      )}
    </div>
  )
}
