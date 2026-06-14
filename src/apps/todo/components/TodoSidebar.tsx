import { useState, useMemo } from 'react'
import { Stack, Text, TextInput, ActionIcon, Tooltip, Group, Paper, Button, Modal } from '@mantine/core'
import { Icon } from '@iconify/react'
import {
  useTodoLists,
  useTodoActiveListId,
  useTodoTasks,
  useTodoSetActiveList,
  useTodoCreateList,
  useTodoRenameList,
  useTodoDeleteList,
} from '@/stores/todo-store'

export default function TodoSidebar() {
  const lists = useTodoLists()
  const activeListId = useTodoActiveListId()
  const allTasks = useTodoTasks()
  const setActiveList = useTodoSetActiveList()
  const createList = useTodoCreateList()
  const renameList = useTodoRenameList()
  const deleteList = useTodoDeleteList()

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of allTasks) {
      if (!t.done) counts[t.listId] = (counts[t.listId] ?? 0) + 1
    }
    return counts
  }, [allTasks])

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    createList(newName.trim())
    setNewName('')
    setAdding(false)
  }

  function handleRename(id: string) {
    if (editText.trim()) renameList(id, editText.trim())
    setEditingId(null)
    setEditText('')
  }

  function handleDelete(id: string) {
    deleteList(id)
    setDeleteConfirm(null)
  }

  return (
    <>
      <Paper withBorder p="sm" style={{ width: 220, minWidth: 220, height: 'fit-content' }}>
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">Lists</Text>

          {lists.map((list) => {
            const isActive = list.id === activeListId
            const count = pendingCounts[list.id] ?? 0

            return (
              <Group
                key={list.id}
                gap={4}
                wrap="nowrap"
                style={{
                  cursor: 'pointer',
                  borderRadius: 'var(--mantine-radius-sm)',
                  background: isActive ? 'var(--mantine-color-amber-0)' : undefined,
                }}
                px="xs"
                py={4}
                onClick={() => setActiveList(list.id)}
              >
                <Icon
                  icon={isActive ? 'lucide:check-square' : 'lucide:square'}
                  width={14}
                  color={isActive ? 'var(--mantine-color-amber-6)' : undefined}
                />

                {editingId === list.id ? (
                  <TextInput
                    value={editText}
                    onChange={(e) => setEditText(e.currentTarget.value)}
                    onBlur={() => handleRename(list.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(list.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    size="xs"
                    style={{ flex: 1 }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Text
                    size="sm"
                    style={{ flex: 1 }}
                    onDoubleClick={() => { setEditingId(list.id); setEditText(list.name) }}
                  >
                    {list.name}
                  </Text>
                )}

                {count > 0 && (
                  <Text size="xs" c="dimmed">{count}</Text>
                )}

                {lists.length > 1 && !editingId && (
                  <Tooltip label="Delete list">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(list.id) }}
                    >
                      <Icon icon="lucide:x" width={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            )
          })}

          {adding ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleCreate() }}
              style={{ display: 'flex', gap: 4 }}
            >
              <TextInput
                placeholder="List name"
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
                size="xs"
                style={{ flex: 1 }}
                autoFocus
                onBlur={() => { if (!newName.trim()) setAdding(false) }}
              />
              <ActionIcon variant="light" size="xs" color="amber" type="submit">
                <Icon icon="lucide:check" width={12} />
              </ActionIcon>
            </form>
          ) : (
            <Button
              variant="subtle"
              size="compact-xs"
              leftSection={<Icon icon="lucide:plus" width={12} />}
              onClick={() => setAdding(true)}
              fullWidth
            >
              New list
            </Button>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete list"
        size="sm"
      >
        <Text size="sm" mb="md">
          This will permanently delete the list and all its tasks. This cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="red" size="xs" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  )
}
