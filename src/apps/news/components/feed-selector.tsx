import { useState, useMemo } from 'react'
import { Modal, TextInput, Group, Text, Badge, Stack, ScrollArea } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'

interface FeedSelectorProps {
  opened: boolean
  onClose: () => void
}

export function FeedSelector({ opened, onClose }: FeedSelectorProps) {
  const catalog = useNewsStore((s) => s.catalog)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const toggleFeed = useNewsStore((s) => s.toggleFeed)
  const [search, setSearch] = useState('')

  const countries = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((f) => f.country && set.add(f.country))
    return Array.from(set).sort()
  }, [catalog])

  const categories = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((f) => set.add(f.category))
    return Array.from(set).sort()
  }, [catalog])

  const [filterCountry, setFilterCountry] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = catalog
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((f) => f.title.toLowerCase().includes(q) || f.url.toLowerCase().includes(q))
    }
    if (filterCountry) items = items.filter((f) => f.country === filterCountry)
    if (filterCategory) items = items.filter((f) => f.category === filterCategory)
    return items
  }, [catalog, search, filterCountry, filterCategory])

  const activeCount = enabledFeedIds.length

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon icon="lucide:rss" width={18} />
          <Text>Feed Catalog ({catalog.length} sources)</Text>
        </Group>
      }
      size="lg"
      scrollAreaComponent={ScrollArea}
    >
      <Stack gap="sm">
        <TextInput
          placeholder="Search feeds..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<Icon icon="lucide:search" width={16} />}
        />

        <Group gap="xs">
          <select
            value={filterCountry ?? ''}
            onChange={(e) => setFilterCountry(e.currentTarget.value || null)}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-default)',
              color: 'var(--mantine-color-text)',
              fontSize: 12,
            }}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterCategory ?? ''}
            onChange={(e) => setFilterCategory(e.currentTarget.value || null)}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-default)',
              color: 'var(--mantine-color-text)',
              fontSize: 12,
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>
            {activeCount} active
          </Text>
        </Group>

        <ScrollArea h={400}>
          <Stack gap={4}>
            {filtered.map((feed) => {
              const isEnabled = enabledFeedIds.includes(feed.id)
              return (
                <Group
                  key={feed.id}
                  gap="xs"
                  p="xs"
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    cursor: 'pointer',
                    background: isEnabled ? 'var(--mantine-color-accent-light)' : undefined,
                    '&:hover': { background: 'var(--mantine-color-gray-light)' },
                  }}
                  onClick={() => toggleFeed(feed.id)}
                >
                  <Icon
                    icon={isEnabled ? 'lucide:check-circle' : 'lucide:circle'}
                    width={16}
                    color={isEnabled ? 'var(--mantine-color-accent-filled)' : 'var(--mantine-color-dimmed)'}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" truncate="end">{feed.title}</Text>
                    <Text size="xs" c="dimmed" truncate="end">{feed.url}</Text>
                  </div>
                  <Group gap={4}>
                    {feed.country && <Badge size="xs" variant="light">{feed.country}</Badge>}
                    <Badge size="xs" variant="outline">{feed.category}</Badge>
                  </Group>
                </Group>
              )
            })}
          </Stack>
        </ScrollArea>
      </Stack>
    </Modal>
  )
}
