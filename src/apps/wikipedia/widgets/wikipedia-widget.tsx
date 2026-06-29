import { WidgetContainer, WidgetLoading } from '@/ui/widget-container'
import { Text, Anchor } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { fetchRandom } from '../utils'
import { useWikipediaStore } from '../wikipedia-store'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'
import { useNavigate } from 'react-router-dom'

export default function WikipediaWidget() {
  const navigate = useNavigate()
  const language = useWidgetOptionsStore((s) => (s.options.wikipedia?.language as string) ?? 'en')
  const bookmarks = useWikipediaStore((s) => s.bookmarks)

  const randomQuery = useQuery({
    queryKey: ['wiki-random-widget', language],
    queryFn: ({ signal }) => fetchRandom(signal, language),
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 30,
  })

  const latest = bookmarks.length > 0
    ? bookmarks[0]
    : randomQuery.data

  if (!latest) {
    if (randomQuery.isLoading) return <WidgetLoading />
    return (
      <WidgetContainer align="center">
        <Icon icon="lucide:book-open" width={24} />
        <Text size="sm">Wikipedia</Text>
        <Anchor size="xs" onClick={() => navigate('/wikipedia')}>
          Open browser
        </Anchor>
      </WidgetContainer>
    )
  }

  const isBookmark = 'savedAt' in latest
  const title = (latest as { title: string }).title
  const pageid = (latest as { pageid: number }).pageid

  return (
    <WidgetContainer align="center">
      <Icon icon="lucide:book-open" width={20} />
      <Text size="xs" c="dimmed">
        {isBookmark ? 'Last saved' : 'Random article'}
      </Text>
      <Anchor
        size="sm"
        fw={600}
        ta="center"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          useWikipediaStore.getState().selectArticle(pageid)
          navigate('/wikipedia')
        }}
      >
        {title}
      </Anchor>
    </WidgetContainer>
  )
}
