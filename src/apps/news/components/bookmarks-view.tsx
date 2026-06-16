import { SimpleGrid, Center, Text, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { ArticleCard } from './article-card'

export function BookmarksView() {
  const articles = useNewsStore((s) => s.getDisplayArticles())
  const activeArticle = useNewsStore((s) => s.activeArticle)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const toggleBookmark = useNewsStore((s) => s.toggleBookmark)
  const setShowBookmarksOnly = useNewsStore((s) => s.setShowBookmarksOnly)

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

      {articles.length === 0 ? (
        <Center py="xl">
          <div style={{ textAlign: 'center' }}>
            <Icon icon="lucide:bookmark" width={40} />
            <Text size="sm" c="dimmed" mt="sm">No bookmarked articles</Text>
            <Text size="xs" c="dimmed">Bookmark articles to read them later</Text>
          </div>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {articles.map((article) => (
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
