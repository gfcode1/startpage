import { useState, useRef } from 'react'
import { TextInput, Select, Group, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useTodoAddTask } from '@/stores/todo-store'
import type { Priority } from '../types'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function TaskInput() {
  const addTask = useTodoAddTask()
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!text.trim()) return
    addTask(
      text.trim(),
      priority,
      category.trim(),
      dueDate ? new Date(dueDate).getTime() : null,
    )
    setText('')
    setPriority('medium')
    setCategory('')
    setDueDate('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
    >
      <Group gap="xs" wrap="nowrap" mb="xs">
        <TextInput
          ref={inputRef}
          placeholder="Add a task..."
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          style={{ flex: 1 }}
          leftSection={<Icon icon="lucide:plus" width={16} />}
          size="sm"
        />
        <ActionIcon
          variant="light"
          color="var(--mantine-color-amber-6)"
          size="input-sm"
          type="submit"
          aria-label="Add task"
        >
          <Icon icon="lucide:plus" width={16} />
        </ActionIcon>
      </Group>

      <Group gap="xs" mb="md">
        <Select
          data={PRIORITY_OPTIONS}
          value={priority}
          onChange={(v) => v && setPriority(v as Priority)}
          size="xs"
          w={110}
          placeholder="Priority"
          aria-label="Priority"
        />
        <TextInput
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
          size="xs"
          w={140}
          aria-label="Category"
        />
        <TextInput
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.currentTarget.value)}
          size="xs"
          w={150}
          placeholder="Due date"
          aria-label="Due date"
        />
      </Group>
    </form>
  )
}
