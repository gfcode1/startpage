import { useState, useCallback } from 'react'
import { TextInput, ActionIcon, Tooltip, Kbd } from '@mantine/core'
import { Icon } from '@iconify/react'

const ENGINES = [
  { label: 'Google', url: 'https://google.com/search?q=' },
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { label: 'Brave', url: 'https://search.brave.com/search?q=' },
]

export default function SearchWidget() {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState(0)

  const search = useCallback(() => {
    if (!query.trim()) return
    window.open(ENGINES[engine]!.url + encodeURIComponent(query.trim()), '_blank')
  }, [query, engine])

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); search() }}
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <Tooltip label={<><Kbd>Enter</Kbd> to search</>}>
        <TextInput
          placeholder="Search the web..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leftSection={<Icon icon="lucide:search" width={16} />}
          style={{ flex: 1 }}
          autoFocus
        />
      </Tooltip>
      <ActionIcon
        variant="subtle"
        onClick={() => setEngine((e) => (e + 1) % ENGINES.length)}
        aria-label={ENGINES[engine]!.label}
      >
        <Icon icon="lucide:globe" width={16} />
      </ActionIcon>
    </form>
  )
}
