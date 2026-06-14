import { Text, Stack, Center, Loader } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

interface QuoteData {
  content: string
  author: string
}

async function fetchQuote(): Promise<QuoteData> {
  const res = await fetch('https://api.quotable.io/random')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return { content: data.content, author: data.author }
}

export default function QuoteWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['quote'],
    queryFn: fetchQuote,
    staleTime: 1000 * 60 * 60 * 24,
    refetchInterval: 1000 * 60 * 60 * 24,
  })

  if (isLoading) return <Center py="md"><Loader size="sm" /></Center>
  if (!data) return null

  return (
    <Stack align="center" gap="xs">
      <Text size="sm" ta="center" style={{ fontStyle: 'italic', lineHeight: 1.4 }}>
        "{data.content}"
      </Text>
      <Text size="xs" c="dimmed">— {data.author}</Text>
    </Stack>
  )
}
