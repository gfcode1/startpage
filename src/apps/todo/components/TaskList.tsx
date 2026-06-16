import { useMemo } from 'react'
import { Text, Paper } from '@mantine/core'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import {
  useTodoTasks,
  useTodoActiveListId,
  useTodoFilter,
  useTodoSearchQuery,
  useTodoSortField,
  useTodoSortOrder,
  getFilteredTasks,
  getSortedTasks,
} from '@/stores/todo-store'
import TaskItem from './TaskItem'

export default function TaskList() {
  const allTasks = useTodoTasks()
  const activeListId = useTodoActiveListId()
  const filter = useTodoFilter()
  const searchQuery = useTodoSearchQuery()
  const sortField = useTodoSortField()
  const sortOrder = useTodoSortOrder()
  const [parent] = useAutoAnimate()

  const tasks = useMemo(
    () => allTasks.filter((t) => t.listId === activeListId),
    [allTasks, activeListId],
  )

  const filteredTasks = useMemo(() => {
    const filtered = getFilteredTasks(tasks, filter, searchQuery)
    return getSortedTasks(filtered, sortField, sortOrder)
  }, [tasks, filter, searchQuery, sortField, sortOrder])

  if (filteredTasks.length === 0) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        {filter === 'all' ? 'No tasks yet. Add one above.' : 'No tasks match this filter.'}
      </Text>
    )
  }

  return (
    <Paper withBorder ref={parent}>
      {filteredTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </Paper>
  )
}
