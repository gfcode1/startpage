import { useState } from 'react'
import { Menu, Button, TextInput, Group, ActionIcon, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import {
  useKanbanBoards, useActiveBoardId,
  useKanbanSetActiveBoard, useKanbanAddBoard,
  useKanbanRenameBoard, useKanbanDeleteBoard,
  useKanbanBoardName,
} from '@/stores/kanban-store'

export function BoardSwitcher() {
  const boards = useKanbanBoards()
  const activeBoardId = useActiveBoardId()
  const activeName = useKanbanBoardName()
  const setActiveBoard = useKanbanSetActiveBoard()
  const addBoard = useKanbanAddBoard()
  const renameBoard = useKanbanRenameBoard()
  const deleteBoard = useKanbanDeleteBoard()

  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addBoard(name)
    setNewName('')
  }

  const activeBoard = boards.find((b) => b.id === activeBoardId)

  return (
    <Group gap={4}>
      <Menu shadow="md" width={260}>
        <Menu.Target>
          <Button
            variant="subtle"
            size="compact-md"
            rightSection={<Icon icon="lucide:chevron-down" width={12} />}
            styles={{ label: { maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
          >
            {activeName || 'Select Board'}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Boards</Menu.Label>
          {boards.map((board) => (
            <Menu.Item
              key={board.id}
              onClick={() => setActiveBoard(board.id)}
              rightSection={board.id === activeBoardId ? (
                <Icon icon="lucide:check" width={14} />
              ) : null}
            >
              <Group gap="xs" justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
                {renamingId === board.id ? (
                  <TextInput
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.currentTarget.value)}
                    onBlur={() => {
                      renameBoard(board.id, renameValue)
                      setRenamingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { renameBoard(board.id, renameValue); setRenamingId(null) }
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    size="xs"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <>
                    <Text size="sm" style={{ flex: 1 }}>{board.name}</Text>
                    <Group gap={2} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => { setRenamingId(board.id); setRenameValue(board.name) }}
                        aria-label={`Rename ${board.name}`}
                      >
                        <Icon icon="lucide:pen" width={11} />
                      </ActionIcon>
                      {boards.length > 1 && (
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => deleteBoard(board.id)}
                          aria-label={`Delete ${board.name}`}
                        >
                          <Icon icon="lucide:trash-2" width={11} />
                        </ActionIcon>
                      )}
                    </Group>
                  </>
                )}
              </Group>
            </Menu.Item>
          ))}
          <Menu.Divider />
          <Menu.Label>New Board</Menu.Label>
          <Group gap={4} px="sm" pb="xs">
            <TextInput
              placeholder="Board name..."
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              size="xs"
              style={{ flex: 1 }}
            />
            <ActionIcon size="sm" variant="light" onClick={handleAdd} aria-label="Create board">
              <Icon icon="lucide:plus" width={14} />
            </ActionIcon>
          </Group>
        </Menu.Dropdown>
      </Menu>
      {activeBoard && boards.length > 1 && (
        <Text size="xs" c="dimmed">
          {activeBoard.columns.length} cols · {activeBoard.columns.reduce((a, c) => a + c.cards.filter((card) => !card.archived).length, 0)} cards
        </Text>
      )}
    </Group>
  )
}
