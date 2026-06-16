import { useMemo } from 'react'
import { Group, ActionIcon, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'

export function CategoryNav() {
  const catalog = useNewsStore((s) => s.catalog)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const selectedCategory = useNewsStore((s) => s.selectedCategory)
  const selectedCountry = useNewsStore((s) => s.selectedCountry)
  const setSelectedCategory = useNewsStore((s) => s.setSelectedCategory)
  const setSelectedCountry = useNewsStore((s) => s.setSelectedCountry)
  const showBookmarksOnly = useNewsStore((s) => s.showBookmarksOnly)
  const setShowBookmarksOnly = useNewsStore((s) => s.setShowBookmarksOnly)

  const countries = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((f) => {
      if (f.country && enabledFeedIds.includes(f.id)) set.add(f.country)
    })
    return Array.from(set).sort()
  }, [catalog, enabledFeedIds])

  const categories = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((f) => {
      if (enabledFeedIds.includes(f.id)) set.add(f.category)
    })
    return Array.from(set).sort()
  }, [catalog, enabledFeedIds])

  return (
    <Group gap="xs">
      <select
        value={selectedCountry ?? ''}
        onChange={(e) => setSelectedCountry(e.currentTarget.value || null)}
        style={{
          padding: '4px 8px',
          borderRadius: 'var(--mantine-radius-sm)',
          border: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-default)',
          color: 'var(--mantine-color-text)',
          fontSize: 12,
          maxWidth: 160,
        }}
      >
        <option value="">All Countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={selectedCategory ?? ''}
        onChange={(e) => setSelectedCategory(e.currentTarget.value || null)}
        style={{
          padding: '4px 8px',
          borderRadius: 'var(--mantine-radius-sm)',
          border: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-default)',
          color: 'var(--mantine-color-text)',
          fontSize: 12,
          maxWidth: 160,
        }}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <Tooltip label="Show bookmarks only">
        <ActionIcon
          variant={showBookmarksOnly ? 'filled' : 'subtle'}
          size="sm"
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
        >
          <Icon icon="lucide:bookmark" width={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
