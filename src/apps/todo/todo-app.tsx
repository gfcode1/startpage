import { Container, Text, Group } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useTodoCurrentList, useTodoPendingCount } from '@/stores/todo-store'
import TaskInput from './components/TaskInput'
import TaskFilters from './components/TaskFilters'
import TaskList from './components/TaskList'
import BulkActions from './components/BulkActions'
import TodoSidebar from './components/TodoSidebar'

export default function TodoApp() {
  const list = useTodoCurrentList()
  const pendingCount = useTodoPendingCount()

  useHotkeys([
    ['alt + N', () => {
      const el = document.querySelector<HTMLInputElement>('[placeholder="Add a task..."]')
      el?.focus()
    }],
  ])

  return (
    <Container size="md" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            {list?.name ?? 'Todo'}
          </Text>
          <Text size="sm" c="dimmed">{pendingCount} pending</Text>
        </div>
      </Group>

      <Group gap="md" align="flex-start" wrap="nowrap">
        <TodoSidebar />

        <div style={{ flex: 1, minWidth: 0 }}>
          <TaskInput />
          <TaskFilters />
          <BulkActions />
          <TaskList />
        </div>
      </Group>
    </Container>
  )
}
