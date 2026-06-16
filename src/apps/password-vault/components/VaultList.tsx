import { Center, Stack, SimpleGrid, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useVaultFilteredEntries, useVaultViewMode, useVaultCategoryMap, useVaultEntries, useVaultSearchQuery, useVaultFilterCategoryId } from '../store'
import VaultEntry from './VaultEntry'
import EmptyState from './EmptyState'

interface VaultListProps {
  onSelect: (id: string) => void
  onAdd: () => void
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
}

export default function VaultList({ onSelect, onAdd, onToggleFavorite, onDelete }: VaultListProps) {
  const entries = useVaultFilteredEntries()
  const allEntries = useVaultEntries()
  const viewMode = useVaultViewMode()
  const categoryMap = useVaultCategoryMap()
  const searchQuery = useVaultSearchQuery()
  const filterCategoryId = useVaultFilterCategoryId()

  if (entries.length === 0 && allEntries.length === 0) return <EmptyState onAdd={onAdd} />
  if (entries.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Icon icon="lucide:search-x" width={36} color="var(--mantine-color-dimmed)" />
          <Text size="sm" c="dimmed">No matching entries</Text>
          {searchQuery && <Text size="xs" c="dimmed">Try a different search term</Text>}
          {filterCategoryId && <Text size="xs" c="dimmed">Try a different category filter</Text>}
        </Stack>
      </Center>
    )
  }

  if (viewMode === 'grid') {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {entries.map((entry) => (
          <VaultEntry
            key={entry.id}
            entry={entry}
            category={entry.categoryId ? categoryMap[entry.categoryId] : undefined}
            viewMode="grid"
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
          />
        ))}
      </SimpleGrid>
    )
  }

  return (
    <Stack gap="xs">
      {entries.map((entry) => (
        <VaultEntry
          key={entry.id}
          entry={entry}
          category={entry.categoryId ? categoryMap[entry.categoryId] : undefined}
          viewMode="list"
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  )
}
