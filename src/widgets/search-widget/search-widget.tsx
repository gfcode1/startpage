import { useState, useCallback } from 'react'
import { TextInput, ActionIcon, Tooltip, Kbd } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'

const ENGINES = [
  { label: 'Google', url: 'https://google.com/search?q=', value: 'google', icon: 'lucide:chrome' },
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', value: 'duckduckgo', icon: 'lucide:bird' },
  { label: 'Brave', url: 'https://search.brave.com/search?q=', value: 'brave', icon: 'lucide:shield' },
]

export default function SearchWidget() {
  const [query, setQuery] = useState('')
  const setOption = useWidgetOptionsStore((s) => s.setOption)
  const currentEngine = useWidgetOptionsStore((s) => (s.options.search?.defaultEngine as string | undefined) ?? 'google')
  const engine = Math.max(0, ENGINES.findIndex((e) => e.value === currentEngine))

  const search = useCallback(() => {
    if (!query.trim()) return
    window.open(ENGINES[engine]!.url + encodeURIComponent(query.trim()), '_blank')
  }, [query, engine])

  const cycleEngine = useCallback(() => {
    const next = ENGINES[(engine + 1) % ENGINES.length]!
    setOption('search', 'defaultEngine', next.value)
  }, [engine, setOption])

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
      <Tooltip label={`Search with ${ENGINES[engine]!.label}`}>
        <ActionIcon
          variant="subtle"
          onClick={cycleEngine}
          aria-label={`Search with ${ENGINES[engine]!.label}`}
        >
          <Icon icon={ENGINES[engine]!.icon} width={16} />
        </ActionIcon>
      </Tooltip>
    </form>
  )
}
