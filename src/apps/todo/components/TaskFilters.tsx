import { TextInput, SegmentedControl, Select, Group } from '@mantine/core'
import { Icon } from '@iconify/react'
import {
  useTodoFilter,
  useTodoSearchQuery,
  useTodoSortField,
  useTodoSortOrder,
  useTodoSetFilter,
  useTodoSetSearchQuery,
  useTodoSetSort,
} from '@/stores/todo-store'
import type { Filter, SortField } from '../types'

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'text', label: 'Alphabetical' },
]

export default function TaskFilters() {
  const filter = useTodoFilter()
  const searchQuery = useTodoSearchQuery()
  const sortField = useTodoSortField()
  const sortOrder = useTodoSortOrder()
  const setFilter = useTodoSetFilter()
  const setSearchQuery = useTodoSetSearchQuery()
  const setSort = useTodoSetSort()

  return (
    <Group mb="md" gap="xs" wrap="wrap">
      <TextInput
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        leftSection={<Icon icon="lucide:search" width={16} />}
        rightSection={searchQuery ? (
          <Icon
            icon="lucide:x"
            width={14}
            style={{ cursor: 'pointer' }}
            onClick={() => setSearchQuery('')}
          />
        ) : undefined}
        size="xs"
        style={{ flex: 1, minWidth: 180 }}
      />

      <SegmentedControl
        value={filter}
        onChange={(v) => { if (v === 'all' || v === 'active' || v === 'completed') setFilter(v as Filter) }}
        data={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Done', value: 'completed' },
        ]}
        size="xs"
      />

      <Select
        data={SORT_OPTIONS}
        value={sortField}
        onChange={(v) => v && setSort(v as SortField)}
        size="xs"
        w={140}
        rightSection={
          <Icon
            icon={sortOrder === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'}
            width={14}
            style={{ cursor: 'pointer' }}
            onClick={() => setSort(sortField)}
          />
        }
        aria-label="Sort by"
      />
    </Group>
  )
}
