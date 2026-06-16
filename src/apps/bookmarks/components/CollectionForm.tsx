import { useState } from 'react'
import { Modal, TextInput, Button, Group, Stack } from '@mantine/core'
import { useAddCollection } from '../store'

interface CollectionFormProps {
  opened: boolean
  onClose: () => void
  parentId?: string | null
}

export default function CollectionForm({ opened, onClose, parentId = null }: CollectionFormProps) {
  const [name, setName] = useState('')
  const addCollection = useAddCollection()

  const handleSubmit = () => {
    if (!name.trim()) return
    addCollection(name.trim(), parentId)
    setName('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New collection" size="sm">
      <Stack>
        <TextInput
          label="Name"
          placeholder="Collection name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          data-autofocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Create</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
