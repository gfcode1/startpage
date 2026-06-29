import { useMemo } from 'react'
import { Text, Checkbox, Group, Stack } from '@mantine/core'
import { Link } from 'react-router-dom'
import { WidgetEmpty } from '@/ui/widget-container'
import {
  useTodoTasks,
  useTodoToggleTask,
} from '@/stores/todo-store'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'

const WIDGET_ID = 'todo'

export default function TodoWidget() {
  const allTasks = useTodoTasks()
  const toggleTask = useTodoToggleTask()

  const listId = useWidgetOptionsStore(
    (s) => (s.options[WIDGET_ID]?.listId as string | undefined) ?? null,
  )

  const filteredTasks = useMemo(() => {
    return listId ? allTasks.filter((t) => t.listId === listId) : allTasks
  }, [allTasks, listId])

  const pendingCount = useMemo(() => filteredTasks.filter((t) => !t.done).length, [filteredTasks])
  const pending = useMemo(() => filteredTasks.filter((t) => !t.done).slice(0, 5), [filteredTasks])

  if (pendingCount === 0) {
    return <WidgetEmpty>All done!</WidgetEmpty>
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">{pendingCount} pending</Text>
      {pending.map((task) => (
        <Group key={task.id} gap="xs" wrap="nowrap">
          <Checkbox
            checked={task.done}
            size="xs"
            onChange={() => toggleTask(task.id)}
          />
          <Text
            size="sm"
            truncate="end"
            style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none' }}
            component={Link}
            to="/todo"
          >
            {task.text}
          </Text>
        </Group>
      ))}
      {pendingCount > 5 && (
        <Text size="xs" c="dimmed" component={Link} to="/todo">
          +{pendingCount - 5} more
        </Text>
      )}
    </Stack>
  )
}
