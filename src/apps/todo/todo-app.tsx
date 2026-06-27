import { Container, Text, Group, ActionIcon, Box, Drawer } from '@mantine/core'
import { useMediaQuery, useHotkeys } from '@mantine/hooks'
import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useTodoCurrentList, useTodoPendingCount } from '@/stores/todo-store'
import TaskInput from './components/TaskInput'
import TaskFilters from './components/TaskFilters'
import TaskList from './components/TaskList'
import BulkActions from './components/BulkActions'
import TodoSidebar from './components/TodoSidebar'

export default function TodoApp() {
  const list = useTodoCurrentList()
  const pendingCount = useTodoPendingCount()
  const isMobile = useMediaQuery('(max-width: 47.999em)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useHotkeys([
    ['alt + N', () => {
      const el = document.querySelector<HTMLInputElement>('[placeholder="Add a task..."]')
      el?.focus()
    }],
  ])

  const sidebar = <TodoSidebar />

  return (
    <Container size="md" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            {list?.name ?? 'Todo'}
          </Text>
          <Text size="sm" c="dimmed">{pendingCount} pending</Text>
        </div>
        {isMobile && (
          <ActionIcon variant="subtle" onClick={() => setSidebarOpen(true)} aria-label="Open lists">
            <Icon icon="lucide:menu" width={20} />
          </ActionIcon>
        )}
      </Group>

      {isMobile ? (
        <>
          <Drawer
            opened={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            title="Lists"
            position="left"
            size="xs"
          >
            {sidebar}
          </Drawer>
          <Box style={{ flex: 1 }}>
            <TaskInput />
            <TaskFilters />
            <BulkActions />
            <TaskList />
          </Box>
        </>
      ) : (
        <Group gap="md" align="flex-start" wrap="nowrap">
          {sidebar}

          <div style={{ flex: 1, minWidth: 0 }}>
            <TaskInput />
            <TaskFilters />
            <BulkActions />
            <TaskList />
          </div>
        </Group>
      )}
    </Container>
  )
}
