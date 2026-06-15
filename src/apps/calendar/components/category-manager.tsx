import { useState } from 'react'
import { Modal, Stack, Group, Text, TextInput, ColorInput, Button, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCalendarStore } from '../store'

interface CategoryManagerProps {
  opened: boolean
  onClose: () => void
}

export function CategoryManager({ opened, onClose }: CategoryManagerProps) {
  const categories = useCalendarStore((s) => s.categories)
  const addCategory = useCalendarStore((s) => s.addCategory)
  const deleteCategory = useCalendarStore((s) => s.deleteCategory)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#4a9eff')

  function handleAdd() {
    if (!newName.trim()) return
    addCategory(newName.trim(), newColor)
    setNewName('')
    setNewColor('#4a9eff')
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Categories" size="sm">
      <Stack gap="sm">
        {categories.length === 0 && (
          <Text size="sm" c="dimmed">No categories yet. Create one below.</Text>
        )}
        {categories.map((cat) => (
          <Group key={cat.id} gap="sm" wrap="nowrap">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <Text size="sm" style={{ flex: 1 }}>{cat.name}</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => deleteCategory(cat.id)}
              aria-label={`Delete ${cat.name}`}
            >
              <Icon icon="lucide:x" width={14} />
            </ActionIcon>
          </Group>
        ))}

        <Text fw={600} size="sm" mt="sm">Add Category</Text>
        <Group gap="sm" wrap="nowrap">
          <TextInput
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <ColorInput value={newColor} onChange={setNewColor} w={100} />
          <Button onClick={handleAdd} size="compact-sm">Add</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
