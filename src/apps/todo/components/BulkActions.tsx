import { Group, Text, Button } from '@mantine/core'
import {
  useTodoSelectedIds,
  useTodoSelectedCount,
  useTodoCompletedCount,
  useTodoSelectAll,
  useTodoClearSelection,
  useTodoDeleteSelected,
  useTodoClearCompleted,
} from '@/stores/todo-store'

export default function BulkActions() {
  const selectedIds = useTodoSelectedIds()
  const selectedCount = useTodoSelectedCount()
  const completedCount = useTodoCompletedCount()
  const selectAll = useTodoSelectAll()
  const clearSelection = useTodoClearSelection()
  const deleteSelected = useTodoDeleteSelected()
  const clearCompleted = useTodoClearCompleted()

  const hasSelection = selectedIds.length > 0
  const hasCompleted = completedCount > 0

  if (!hasSelection && !hasCompleted) return null

  return (
    <Group gap="xs" mb="md" px="xs">
      {hasSelection && (
        <>
          <Text size="xs" c="dimmed">{selectedCount} selected</Text>
          <Button size="compact-xs" variant="light" onClick={clearSelection}>
            Deselect
          </Button>
          <Button size="compact-xs" variant="light" color="red" onClick={deleteSelected}>
            Delete selected
          </Button>
        </>
      )}

      {!hasSelection && hasCompleted && (
        <Button size="compact-xs" variant="light" color="orange" onClick={clearCompleted}>
          Clear completed ({completedCount})
        </Button>
      )}

      {!hasSelection && (
        <Button size="compact-xs" variant="subtle" onClick={selectAll}>
          Select all
        </Button>
      )}
    </Group>
  )
}
