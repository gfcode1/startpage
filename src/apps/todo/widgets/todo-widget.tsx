import { useState, useEffect } from 'react'
import { Text, Checkbox, Group, Stack } from '@mantine/core'
import type { Task } from '../types'
import { loadTasks, saveTasks } from '../utils'
import { getStorage } from '@/lib/storage/engine'

const STORAGE_KEY = 'todo:tasks'

export default function TodoWidget() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    const unsub = getStorage().subscribe(STORAGE_KEY, () => {
      setTasks(loadTasks())
    })
    return unsub
  }, [])

  const handleToggle = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    setTasks(updated)
    saveTasks(updated)
  }

  const pending = tasks.filter((t) => !t.done).slice(0, 5)
  const totalPending = tasks.filter((t) => !t.done).length

  if (totalPending === 0) {
    return (
      <Stack align="center" gap="xs">
        <Text size="sm" c="dimmed">All done!</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">{totalPending} pending</Text>
      {pending.map((task) => (
        <Group key={task.id} gap="xs" wrap="nowrap">
          <Checkbox
            checked={task.done}
            size="xs"
            onChange={() => handleToggle(task.id)}
          />
          <Text size="sm" truncate="end" style={{ flex: 1 }}>
            {task.text}
          </Text>
        </Group>
      ))}
      {totalPending > 5 && (
        <Text size="xs" c="dimmed">+{totalPending - 5} more</Text>
      )}
    </Stack>
  )
}
