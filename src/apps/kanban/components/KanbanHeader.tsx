import { useState } from 'react'
import { Text, Group, TextInput, Button, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Filter } from '../types'
import { useKanbanCardCount, useKanbanSetSearchQuery, useKanbanSetFilter, useKanbanAddColumn } from '@/stores/kanban-store'

export function KanbanHeader() {
  const [newColTitle, setNewColTitle] = useState('')
  const cardCount = useKanbanCardCount()
  const setSearchQuery = useKanbanSetSearchQuery()
  const setFilter = useKanbanSetFilter()
  const addColumn = useKanbanAddColumn()

  const handleAddColumn = () => {
    const title = newColTitle.trim()
    if (!title) return
    addColumn(title)
    setNewColTitle('')
  }

  const filters: { value: Filter; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'lucide:list' },
    { value: 'critical', label: 'Critical', icon: 'lucide:alert-circle' },
    { value: 'high', label: 'High', icon: 'lucide:arrow-up' },
    { value: 'medium', label: 'Medium', icon: 'lucide:minus' },
    { value: 'low', label: 'Low', icon: 'lucide:arrow-down' },
  ]

  return (
    <Group justify="space-between" mb="md" wrap="wrap">
      <div>
        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
          Kanban
        </Text>
        <Text size="sm" c="dimmed">{cardCount} cards in total</Text>
      </div>

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
      </Group>
    </Group>
  )
}
