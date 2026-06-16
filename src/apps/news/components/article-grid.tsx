import { useMemo } from 'react'
import { SimpleGrid, Center, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { ArticleCard } from './article-card'

export function ArticleGrid() {
  const articles = useNewsStore((s) => s.articles)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const bookmarks = useNewsStore((s) => s.bookmarks)
  const searchQuery = useNewsStore((s) => s.searchQuery)
  const selectedCategory = useNewsStore((s) => s.selectedCategory)
  const selectedCountry = useNewsStore((s) => s.selectedCountry)
  const showBookmarksOnly = useNewsStore((s) => s.showBookmarksOnly)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const toggleBookmark = useNewsStore((s) => s.toggleBookmark)
  const viewMode = useNewsStore((s) => s.viewMode)
  const catalog = useNewsStore((s) => s.catalog)

  const allArticles = useMemo(() => {
    const ids = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
    const result: import('../types').NewsArticle[] = []
    for (const id of ids) {
      const cache = articles[id]
      if (cache) result.push(...cache.items)
    }
    return result.sort((a, b) => b.publishedAt - a.publishedAt)
  }, [articles, enabledFeedIds, customFeeds])

  const filtered = useMemo(() => {
    let items = allArticles

    if (showBookmarksOnly) {
      items = items.filter((a) => bookmarks.includes(a.id))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.feedTitle.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      const catFeedIds = catalog
        .filter((f) => f.category === selectedCategory)
        .map((f) => f.id)
      items = items.filter((a) => catFeedIds.includes(a.feedId))
    }

    if (selectedCountry) {
      const countryFeedIds = catalog
        .filter((f) => f.country === selectedCountry)
        .map((f) => f.id)
      items = items.filter((a) => countryFeedIds.includes(a.feedId))
    }

    return items
  }, [allArticles, showBookmarksOnly, bookmarks, searchQuery, selectedCategory, selectedCountry, catalog])

  if (filtered.length === 0) {
    return (
      <Center py="xl">
        <div style={{ textAlign: 'center' }}>
          <Icon icon="lucide:newspaper" width={40} />
          <Text size="sm" c="dimmed" mt="sm">No articles found</Text>
          <Text size="xs" c="dimmed">Try adding some feeds or changing filters</Text>
        </div>
      </Center>
    )
  }

  const cols = viewMode === 'grid' ? { base: 1, sm: 2, lg: 3 } : { base: 1 }

  return (
    <SimpleGrid cols={cols} spacing="sm">
      {filtered.slice(0, 200).map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelect={setActiveArticle}
          onToggleBookmark={toggleBookmark}
        />
      ))}
    </SimpleGrid>
  )
}
