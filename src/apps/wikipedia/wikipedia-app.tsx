import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Container, Text, Group, Paper, TextInput, ActionIcon,
  Loader, Center, Anchor, Alert,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useHotkeys } from '@mantine/hooks'
import DOMPurify from 'dompurify'

interface WikiPage {
  title: string
  pageid: number
  snippet: string
  extract?: string
  thumbnail?: { source: string }
}

async function searchWiki(query: string, signal?: AbortSignal): Promise<WikiPage[]> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=20`,
    { signal },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.query?.search ?? []
}

async function fetchPage(id: number, signal?: AbortSignal): Promise<WikiPage | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&pageids=${id}&prop=extracts|pageimages&exintro&explaintext&format=json&origin=*`,
    { signal },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) return null
  const entries = Object.values(pages) as { title?: string; pageid?: number; extract?: string; thumbnail?: { source: string } }[]
  const page = entries[0]
  return page ? { title: page.title ?? '', pageid: page.pageid ?? 0, snippet: '', extract: page.extract, thumbnail: page.thumbnail } : null
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function WikipediaApp() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const searchQuery = useQuery({
    queryKey: ['wiki-search', debouncedQuery],
    queryFn: ({ signal }) => searchWiki(debouncedQuery, signal),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })

  const pageQuery = useQuery({
    queryKey: ['wiki-page', selectedId],
    queryFn: ({ signal }) => fetchPage(selectedId!, signal),
    enabled: selectedId !== null,
    staleTime: 1000 * 60 * 5,
  })

  useHotkeys([
    ['alt + F', () => searchRef.current?.focus()],
  ])

  const openPage = useCallback((id: number) => {
    setSelectedId(id)
    window.scrollTo({ top: 0 })
  }, [])

  const page = pageQuery.data
  const showPage = page && selectedId

  if (showPage) {
    return (
      <Container size="md" py="md">
        <Group mb="md">
          <ActionIcon variant="subtle" onClick={() => setSelectedId(null)} aria-label="Back to search results">
            <Icon icon="lucide:arrow-left" width={20} />
          </ActionIcon>
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            {page.title}
          </Text>
        </Group>

        {pageQuery.isFetching && (
          <Center py="md"><Loader size="sm" /></Center>
        )}

        {page.thumbnail && (
          <img
            src={page.thumbnail.source}
            alt={page.title}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--mantine-radius-md)', marginBottom: 16 }}
          />
        )}

        <Text size="sm" style={{ lineHeight: 1.7 }}>
          {page.extract ?? 'No content available.'}
        </Text>

        <Anchor
          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title).replace(/%20/g, '_')}`}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          mt="md"
        >
          Read full article on Wikipedia →
        </Anchor>
      </Container>
    )
  }

  return (
    <Container size="md" py="md">
      <Text fw={700} size="lg" mb="md" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
        Wikipedia
      </Text>

      <TextInput
        ref={searchRef}
        placeholder="Search Wikipedia... (min 3 characters)"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        leftSection={<Icon icon="lucide:search" width={16} />}
        mb="md"
        autoFocus
      />

      {searchQuery.isLoading && (
        <Center py="xl"><Loader /></Center>
      )}

      {searchQuery.isError && (
        <Alert color="red" title="Error" mb="md">Search failed. Please try again.</Alert>
      )}

      {pageQuery.isLoading && selectedId && (
        <Center py="xl"><Loader /></Center>
      )}

      {searchQuery.data?.map((item) => (
        <Paper
          key={item.pageid}
          withBorder
          p="sm"
          mb="xs"
          style={{ cursor: 'pointer' }}
          onClick={() => openPage(item.pageid)}
        >
          <Text size="sm" fw={600} mb={4}>{item.title}</Text>
          <Text size="xs" c="dimmed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.snippet) }} />
        </Paper>
      ))}

      {debouncedQuery.length > 2 && !searchQuery.isLoading && !searchQuery.isError && searchQuery.data?.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">No results found.</Text>
      )}

      {query.length <= 2 && query.length > 0 && (
        <Text ta="center" c="dimmed" py="xl">Type at least 3 characters to search.</Text>
      )}
    </Container>
  )
}
