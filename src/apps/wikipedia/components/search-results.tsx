import { Center, Loader, Alert, Text, Stack } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { searchWiki } from '../utils'
import { DEBOUNCE_MS } from '../shared'
import { ArticleCard } from './article-card'
import { useWikipediaStore, useWikipediaQuery } from '../wikipedia-store'
import { useDebouncedValue } from '@mantine/hooks'

export function SearchResults() {
  const query = useWikipediaQuery()
  const [debouncedQuery] = useDebouncedValue(query, DEBOUNCE_MS)
  const { bookmarks, selectArticle, addBookmark, removeBookmark, isBookmarked } = useWikipediaStore()

  const searchQuery = useQuery({
    queryKey: ['wiki-search', debouncedQuery],
    queryFn: ({ signal }) => searchWiki(debouncedQuery, 0, signal),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })

  if (query.length > 0 && query.length <= 2) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        Type at least 3 characters to search.
      </Text>
    )
  }

  if (debouncedQuery.length <= 2) return null

  if (searchQuery.isError) {
    return (
      <Alert
        color="red"
        title="Error"
        icon={<Icon icon="lucide:alert-circle" width={16} />}
      >
        Search failed. Please try again.
      </Alert>
    )
  }

  if (searchQuery.isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  const results = searchQuery.data?.results ?? []

  if (results.length === 0) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        No results found.
      </Text>
    )
  }

  const handleToggleBookmark = (pageid: number, title: string, thumbnail?: string) => {
    if (isBookmarked(pageid)) {
      removeBookmark(pageid)
    } else {
      addBookmark(pageid, title, thumbnail)
    }
  }

  return (
    <Stack gap={0}>
      {searchQuery.data && (
        <Text size="xs" c="dimmed" mb="xs">
          {searchQuery.data.total.toLocaleString()} results
        </Text>
      )}
      {results.map((item) => (
        <ArticleCard
          key={item.pageid}
          page={item}
          isBookmarked={bookmarks.some((b) => b.pageid === item.pageid)}
          onSelect={selectArticle}
          onToggleBookmark={handleToggleBookmark}
        />
      ))}
    </Stack>
  )
}
