import { TextInput } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useWikipediaQuery, useWikipediaSetQuery } from '../wikipedia-store'

export function SearchBar() {
  const query = useWikipediaQuery()
  const setQuery = useWikipediaSetQuery()

  return (
    <TextInput
      placeholder="Search Wikipedia..."
      value={query}
      onChange={(e) => setQuery(e.currentTarget.value)}
      leftSection={<Icon icon="lucide:search" width={16} />}
      autoFocus
    />
  )
}
