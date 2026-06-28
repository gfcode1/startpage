import { useState, useEffect, useCallback } from 'react'
import { Group, TextInput, Button, ActionIcon, Switch } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Filter } from '../types'
import {
  useKanbanSetSearchQuery, useKanbanSetFilter,
  useKanbanAddColumn, useKanbanUndo, useKanbanRedo,
  useKanbanUndoCount, useKanbanRedoCount,
} from '@/stores/kanban-store'
import { BoardSwitcher } from './BoardSwitcher'

interface KanbanHeaderProps {
  showArchived: boolean
  onToggleArchived: () => void
}

export function KanbanHeader({ showArchived, onToggleArchived }: KanbanHeaderProps) {
  const [newColTitle, setNewColTitle] = useState('')
  const setSearchQuery = useKanbanSetSearchQuery()
  const setFilter = useKanbanSetFilter()
  const addColumn = useKanbanAddColumn()
  const undo = useKanbanUndo()
  const redo = useKanbanRedo()
  const undoCount = useKanbanUndoCount()
  const redoCount = useKanbanRedoCount()

  const handleAddColumn = () => {
    const title = newColTitle.trim()
    if (!title) return
    addColumn(title)
    setNewColTitle('')
  }

  const handleUndo = useCallback(() => undo(), [undo])
  const handleRedo = useCallback(() => redo(), [redo])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      if (ctrl && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleRedo()
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  const filters: { value: Filter; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'lucide:list' },
    { value: 'critical', label: 'Critical', icon: 'lucide:alert-circle' },
    { value: 'high', label: 'High', icon: 'lucide:arrow-up' },
    { value: 'medium', label: 'Medium', icon: 'lucide:minus' },
    { value: 'low', label: 'Low', icon: 'lucide:arrow-down' },
  ]

  return (
    <Group justify="space-between" mb="md" wrap="wrap">
      <Group gap="xs">
        <BoardSwitcher />
      </Group>

      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder="Search cards..."
          size="xs"
          leftSection={<Icon icon="lucide:search" width={14} />}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          aria-label="Search cards"
        />

        <Button.Group>
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="default"
              size="compact-xs"
              onClick={() => setFilter(f.value)}
              px={6}
              title={f.label}
            >
              <Icon icon={f.icon} width={14} />
            </Button>
          ))}
        </Button.Group>

        <Group gap={2}>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={handleUndo}
            disabled={undoCount === 0}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Icon icon="lucide:undo-2" width={14} />
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={handleRedo}
            disabled={redoCount === 0}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Icon icon="lucide:redo-2" width={14} />
          </ActionIcon>
        </Group>

        <Group gap={4}>
          <TextInput
            placeholder="New column..."
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            size="xs"
          />
          <ActionIcon size="sm" variant="light" onClick={handleAddColumn} aria-label="Add column">
            <Icon icon="lucide:plus" width={14} />
          </ActionIcon>
        </Group>

        <Switch
          size="xs"
          label="Archived"
          checked={showArchived}
          onChange={onToggleArchived}
        />
      </Group>
    </Group>
  )
}
