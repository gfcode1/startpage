import { useState } from 'react'
import { Modal, Stack, TextInput, Textarea, Select, Group, Button, PasswordInput, Collapse } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { VaultEntry, Category } from '../types'
import { createEntry } from '../utils'
import { useVaultAddEntry, useVaultUpdateEntry } from '../store'
import PasswordGenerator from './PasswordGenerator'

interface VaultEntryFormProps {
  opened: boolean
  onClose: () => void
  editEntry?: VaultEntry | null
  categories: Category[]
}

export default function VaultEntryForm({ opened, onClose, editEntry, categories }: VaultEntryFormProps) {
  const addEntry = useVaultAddEntry()
  const updateEntry = useVaultUpdateEntry()

  const [name, setName] = useState(editEntry?.name ?? '')
  const [url, setUrl] = useState(editEntry?.url ?? '')
  const [username, setUsername] = useState(editEntry?.username ?? '')
  const [password, setPassword] = useState(editEntry?.password ?? '')
  const [notes, setNotes] = useState(editEntry?.notes ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(editEntry?.categoryId ?? null)
  const [showGenerator, setShowGenerator] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    if (editEntry) {
      updateEntry(editEntry.id, { name, url, username, password, notes, categoryId })
    } else {
      addEntry(createEntry(name, url, username, password, notes, categoryId))
    }
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editEntry ? 'Edit entry' : 'Add entry'}
      size="md"
      key={editEntry?.id ?? 'new'}
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          placeholder="e.g. GitHub"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          data-autofocus
        />
        <TextInput
          label="URL"
          placeholder="e.g. github.com"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
        />
        <TextInput
          label="Username"
          placeholder="e.g. user@example.com"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter or generate"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          rightSectionPointerEvents="all"
          rightSection={
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => setShowGenerator(!showGenerator)}
            >
              <Icon icon="lucide:sparkles" width={14} />
            </Button>
          }
        />
        <Collapse expanded={showGenerator}>
          <PasswordGenerator onSelect={(p) => { setPassword(p); setShowGenerator(false) }} />
        </Collapse>
        <Textarea
          label="Notes"
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />
        <Select
          label="Category"
          placeholder="None"
          data={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
          clearable
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editEntry ? 'Save' : 'Add'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
