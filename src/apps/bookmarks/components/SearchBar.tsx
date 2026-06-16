import { TextInput, Group, Select, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useSearchQuery, useSetSearchQuery, useSortField, useSortOrder, useSetSort, useFilter, useSetFilter } from '../store'
import type { SortField, BookmarkFilter } from '../types'

export default function SearchBar() {
  const searchQuery = useSearchQuery()
  const setSearchQuery = useSetSearchQuery()
  const sortField = useSortField()
  const sortOrder = useSortOrder()
  const setSort = useSetSort()
  const filter = useFilter()
  const setFilter = useSetFilter()

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'updatedAt', label: 'Updated' },
    { value: 'createdAt', label: 'Created' },
    { value: 'title', label: 'Title' },
    { value: 'url', label: 'URL' },
  ]

  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        placeholder="Search bookmarks..."
        leftSection={<Icon icon="lucide:search" width={14} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        rightSection={searchQuery ? (
          <ActionIcon size="xs" variant="subtle" onClick={() => setSearchQuery('')}>
            <Icon icon="lucide:x" width={12} />
          </ActionIcon>
        ) : null}
        style={{ flex: 1 }}
      />
      <Select
        data={[
          { value: 'all', label: 'All' },
          { value: 'favorites', label: 'Favorites' },
          { value: 'readLater', label: 'Read Later' },
        ]}
        value={filter}
        onChange={(v) => setFilter((v as BookmarkFilter) ?? 'all')}
        size="xs"
        w={120}
      />
      <Select
        data={sortOptions}
        value={sortField}
        onChange={(v) => v && setSort(v as SortField)}
        size="xs"
        w={110}
      />
      <ActionIcon size="sm" variant="subtle" onClick={() => setSort(sortField)} title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
        <Icon icon={sortOrder === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'} width={14} />
      </ActionIcon>
    </Group>
  )
}
