import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { SimpleGrid, Center, Text, Loader, Group } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { ArticleCard } from './article-card'
import { filterArticles } from '../utils'

const PAGE_SIZE = 30

export function ArticleGrid() {
  const articles = useNewsStore((s) => s.articles)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const bookmarks = useNewsStore((s) => s.bookmarks)
  const searchQuery = useNewsStore((s) => s.searchQuery)
  const selectedCategory = useNewsStore((s) => s.selectedCategory)
  const selectedCountry = useNewsStore((s) => s.selectedCountry)
  const showBookmarksOnly = useNewsStore((s) => s.showBookmarksOnly)
  const showUnreadOnly = useNewsStore((s) => s.showUnreadOnly)
  const sortBy = useNewsStore((s) => s.sortBy)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const toggleBookmark = useNewsStore((s) => s.toggleBookmark)
  const viewMode = useNewsStore((s) => s.viewMode)
  const catalog = useNewsStore((s) => s.catalog)

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const allArticles = useMemo(() => {
    const ids = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
    const result: import('../types').NewsArticle[] = []
    for (const id of ids) {
      const cache = articles[id]
      if (cache) result.push(...cache.items)
    }
    return result
  }, [articles, enabledFeedIds, customFeeds])

  const filtered = useMemo(() =>
    filterArticles(allArticles, {
      searchQuery,
      selectedCategory,
      selectedCountry,
      showBookmarksOnly,
      showUnreadOnly,
      bookmarks,
      sortBy,
      catalog,
      customFeeds,
    }),
  [allArticles, searchQuery, selectedCategory, selectedCountry, showBookmarksOnly, showUnreadOnly, bookmarks, sortBy, catalog, customFeeds])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE) // eslint-disable-line react-hooks/set-state-in-effect
  }, [searchQuery, selectedCategory, selectedCountry, showBookmarksOnly, showUnreadOnly, sortBy])

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
  }, [filtered.length])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const displayed = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

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
    <div>
      <SimpleGrid cols={cols} spacing="sm">
        {displayed.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSelect={setActiveArticle}
            onToggleBookmark={toggleBookmark}
          />
        ))}
      </SimpleGrid>
      {hasMore && (
        <Center py="md" ref={sentinelRef}>
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="xs" c="dimmed">
              {visibleCount} of {filtered.length} articles
            </Text>
          </Group>
        </Center>
      )}
    </div>
  )
}
