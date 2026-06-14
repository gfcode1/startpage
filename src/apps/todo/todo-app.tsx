import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  Container, Text, TextInput, Checkbox, ActionIcon, Group,
  SegmentedControl, Paper,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useHotkeys } from '@mantine/hooks'
import type { Task } from './types'
import { loadTasks, saveTasks, createTask } from './utils'

type Filter = 'all' | 'active' | 'completed'

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [newText, setNewText] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Save on change
  useEffect(() => { saveTasks(tasks) }, [tasks])

  // Hotkeys
  useHotkeys([
    ['alt + N', () => inputRef.current?.focus()],
  ])

  const addTask = useCallback(() => {
    const text = newText.trim()
    if (!text) return
    setTasks((prev) => [createTask(text), ...prev])
    setNewText('')
  }, [newText])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startEdit = useCallback((task: Task) => {
    setEditingId(task.id)
    setEditText(task.text)
  }, [])

  const saveEdit = useCallback((id: string) => {
    const text = editText.trim()
    if (text) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)))
    }
    setEditingId(null)
    setEditText('')
  }, [editText])

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'completed') return t.done
    return true
  }), [tasks, filter])

  const pendingCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks])

  return (
    <Container size="sm" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={700} size="lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Todo
          </Text>
          <Text size="sm" c="dimmed">{pendingCount} pending</Text>
        </div>
        <SegmentedControl
          value={filter}
          onChange={(v) => { if (v === 'all' || v === 'active' || v === 'completed') setFilter(v) }}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Done', value: 'completed' },
          ]}
          size="xs"
        />
      </Group>

      <form
        onSubmit={(e) => { e.preventDefault(); addTask() }}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <TextInput
          ref={inputRef}
          placeholder="Add a task..."
          value={newText}
          onChange={(e) => setNewText(e.currentTarget.value)}
          style={{ flex: 1 }}
          leftSection={<Icon icon="lucide:plus" width={16} />}
        />
      </form>

      {filteredTasks.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">
          {filter === 'all' ? 'No tasks yet. Add one above.' : 'No tasks match this filter.'}
        </Text>
      )}

      <Paper withBorder>
        {filteredTasks.map((task) => (
          <Group
            key={task.id}
            px="md"
            py="sm"
            style={{
              borderBottom: '1px solid var(--mantine-color-dark-6)',
              opacity: task.done ? 0.5 : 1,
            }}
            wrap="nowrap"
          >
            <Checkbox
              checked={task.done}
              onChange={() => toggleTask(task.id)}
              aria-label={`Mark "${task.text}" as ${task.done ? 'pending' : 'done'}`}
            />

            {editingId === task.id ? (
              <TextInput
                value={editText}
                onChange={(e) => setEditText(e.currentTarget.value)}
                onBlur={() => saveEdit(task.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(task.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
                style={{ flex: 1 }}
                size="sm"
              />
            ) : (
              <Text
                style={{
                  flex: 1,
                  textDecoration: task.done ? 'line-through' : 'none',
                  cursor: 'pointer',
                }}
                size="sm"
                onClick={() => startEdit(task)}
              >
                {task.text}
              </Text>
            )}

            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => deleteTask(task.id)}
              aria-label={`Delete "${task.text}"`}
            >
              <Icon icon="lucide:trash-2" width={14} />
            </ActionIcon>
          </Group>
        ))}
      </Paper>
    </Container>
  )
}
