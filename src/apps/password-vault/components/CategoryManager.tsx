import { useState } from 'react'
import { Stack, Group, Text, TextInput, Button, ActionIcon, Modal, ColorInput } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useVaultCategories, useVaultAddCategory, useVaultRenameCategory, useVaultDeleteCategory } from '../store'
import { createCategory } from '../utils'

export default function CategoryManager({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const categories = useVaultCategories()
  const addCategory = useVaultAddCategory()
  const renameCategory = useVaultRenameCategory()
  const deleteCategory = useVaultDeleteCategory()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#4a9eff')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    addCategory(createCategory(newName, 'lucide:folder', newColor))
    setNewName('')
    setNewColor('#4a9eff')
  }

  const handleRename = (id: string) => {
    if (editName.trim()) renameCategory(id, editName)
    setEditingId(null)
    setEditName('')
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Categories" size="sm">
      <Stack gap="sm">
        {categories.map((cat) => (
          <Group key={cat.id} justify="space-between">
            {editingId === cat.id ? (
              <TextInput
                size="xs"
                value={editName}
                onChange={(e) => setEditName(e.currentTarget.value)}
                onBlur={() => handleRename(cat.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id)}
                style={{ flex: 1 }}
              />
            ) : (
              <Group gap="xs" style={{ flex: 1 }}>
                <Icon icon={cat.icon} width={16} color={cat.color} />
                <Text size="sm">{cat.name}</Text>
              </Group>
            )}
            <Group gap={4}>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
              >
                <Icon icon="lucide:pencil" width={14} />
              </ActionIcon>
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deleteCategory(cat.id)}>
                <Icon icon="lucide:trash-2" width={14} />
              </ActionIcon>
            </Group>
          </Group>
        ))}

        <Text size="xs" fw={600} mt="sm">Add category</Text>
        <Group gap="xs">
          <ColorInput size="xs" value={newColor} onChange={setNewColor} w={80} />
          <TextInput
            size="xs"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1 }}
          />
          <Button size="compact-xs" onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
