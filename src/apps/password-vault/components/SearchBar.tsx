import { Group, TextInput, Select, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useVaultSearchQuery, useVaultSetSearchQuery, useVaultCategories, useVaultFilterCategoryId, useVaultSetFilterCategoryId, useVaultSortField, useVaultSetSort, useVaultViewMode, useVaultSetViewMode } from '../store'
import type { SortField } from '../types'

export default function SearchBar() {
  const searchQuery = useVaultSearchQuery()
  const setSearchQuery = useVaultSetSearchQuery()
  const categories = useVaultCategories()
  const filterCategoryId = useVaultFilterCategoryId()
  const setFilterCategoryId = useVaultSetFilterCategoryId()
  const sortField = useVaultSortField()
  const setSort = useVaultSetSort()
  const viewMode = useVaultViewMode()
  const setViewMode = useVaultSetViewMode()

  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        placeholder="Search passwords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        leftSection={<Icon icon="lucide:search" width={14} />}
        size="sm"
        style={{ flex: 1 }}
      />
      <Select
        placeholder="Category"
        data={[
          { value: '', label: 'All categories' },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]}
        value={filterCategoryId ?? ''}
        onChange={(v) => setFilterCategoryId(v || null)}
        size="sm"
        w={160}
        clearable
      />
      <Select
        placeholder="Sort"
        data={[
          { value: 'updatedAt', label: 'Updated' },
          { value: 'createdAt', label: 'Created' },
          { value: 'name', label: 'Name' },
        ]}
        value={sortField}
        onChange={(v) => v && setSort(v as SortField)}
        size="sm"
        w={120}
      />
      <ActionIcon
        size="sm"
        variant={viewMode === 'list' ? 'light' : 'subtle'}
        onClick={() => setViewMode('list')}
      >
        <Icon icon="lucide:list" width={16} />
      </ActionIcon>
      <ActionIcon
        size="sm"
        variant={viewMode === 'grid' ? 'light' : 'subtle'}
        onClick={() => setViewMode('grid')}
      >
        <Icon icon="lucide:layout-grid" width={16} />
      </ActionIcon>
    </Group>
  )
}
