import { useState } from 'react'
import { Container, Group, Button, Text, Title } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useVaultEntries, useVaultCategories, useVaultToggleFavorite, useVaultDeleteEntry, useVaultSetSelectedEntryId, useVaultEntryById, useVaultSelectedEntryId } from './store'
import SearchBar from './components/SearchBar'
import VaultList from './components/VaultList'
import VaultEntryForm from './components/VaultEntryForm'
import VaultEntryDetail from './components/VaultEntryDetail'
import CategoryManager from './components/CategoryManager'

export default function PasswordVaultApp() {
  const entries = useVaultEntries()
  const categories = useVaultCategories()
  const toggleFavorite = useVaultToggleFavorite()
  const deleteEntry = useVaultDeleteEntry()
  const setSelectedEntryId = useVaultSetSelectedEntryId()
  const selectedEntryId = useVaultSelectedEntryId()
  const selectedEntry = useVaultEntryById(selectedEntryId)

  const [formOpen, setFormOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<typeof selectedEntry>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleSelect = (id: string) => {
    setSelectedEntryId(id)
    setDetailOpen(true)
  }

  const handleEdit = (entry: typeof selectedEntry) => {
    if (!entry) return
    setEditEntry(entry)
    setDetailOpen(false)
    setFormOpen(true)
  }

  return (
    <Container size="lg" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={3}>Password Vault</Title>
          <Text size="sm" c="dimmed">{entries.length} stored</Text>
        </div>
        <Group gap="xs">
          <Button
            size="sm"
            variant="subtle"
            leftSection={<Icon icon="lucide:folder-tree" width={14} />}
            onClick={() => setCategoryManagerOpen(true)}
          >
            Categories
          </Button>
          <Button
            size="sm"
            leftSection={<Icon icon="lucide:plus" width={16} />}
            onClick={() => { setEditEntry(null); setFormOpen(true) }}
          >
            Add password
          </Button>
        </Group>
      </Group>

      <SearchBar />

      <VaultList
        onSelect={handleSelect}
        onAdd={() => { setEditEntry(null); setFormOpen(true) }}
        onToggleFavorite={toggleFavorite}
        onDelete={deleteEntry}
      />

      <VaultEntryForm
        opened={formOpen}
        onClose={() => { setFormOpen(false); setEditEntry(null) }}
        editEntry={editEntry}
        categories={categories}
      />

      <VaultEntryDetail
        entry={selectedEntry}
        category={categories.find((c) => c.id === selectedEntry?.categoryId)}
        opened={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedEntryId(null) }}
        onEdit={handleEdit}
        onDelete={deleteEntry}
      />

      <CategoryManager opened={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />
    </Container>
  )
}
