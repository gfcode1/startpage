import { useState, useCallback } from 'react'
import { Text, Checkbox, TextInput, ActionIcon, Group, Badge, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useTodoToggleTask, useTodoDeleteTask, useTodoUpdateTask, useTodoSelectedIds, useTodoToggleSelectTask } from '@/stores/todo-store'
import type { Task, Priority } from '../types'

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  high: { color: 'red', label: 'High' },
  medium: { color: 'yellow', label: 'Med' },
  low: { color: 'gray', label: 'Low' },
}

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const toggleTask = useTodoToggleTask()
  const deleteTask = useTodoDeleteTask()
  const updateTask = useTodoUpdateTask()
  const selectedIds = useTodoSelectedIds()
  const toggleSelectTask = useTodoToggleSelectTask()

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [now] = useState(Date.now)

  const isSelected = selectedIds.includes(task.id)
  const isOverdue = task.dueDate !== null && task.dueDate < now && !task.done
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium

  const saveEdit = useCallback(() => {
    const text = editText.trim()
    if (text) {
      updateTask(task.id, { text })
    }
    setEditing(false)
    setEditText(text || task.text)
  }, [editText, task.id, task.text, updateTask])

  return (
    <Group
      px="md"
      py="sm"
      wrap="nowrap"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        opacity: task.done ? 0.5 : 1,
        background: isSelected ? 'var(--mantine-color-amber-0)' : undefined,
      }}
    >
      <Checkbox
        checked={isSelected}
        onChange={() => toggleSelectTask(task.id)}
        aria-label={`Select "${task.text}"`}
        size="xs"
      />

      <Checkbox
        checked={task.done}
        onChange={() => toggleTask(task.id)}
        aria-label={`Mark "${task.text}" as ${task.done ? 'pending' : 'done'}`}
        size="xs"
      />

      <Badge
        color={priorityCfg.color}
        size="sm"
        variant="light"
        styles={{ label: { textTransform: 'none' } }}
      >
        {priorityCfg.label}
      </Badge>

      {task.category && (
        <Badge size="sm" variant="outline" color="gray" styles={{ label: { textTransform: 'none' } }}>
          {task.category}
        </Badge>
      )}

      {editing ? (
        <TextInput
          value={editText}
          onChange={(e) => setEditText(e.currentTarget.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') { setEditing(false); setEditText(task.text) }
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
          onClick={() => { setEditing(true); setEditText(task.text) }}
        >
          {task.text}
        </Text>
      )}

      {task.dueDate && (
        <Tooltip label={new Date(task.dueDate).toLocaleDateString()}>
          <Text
            size="xs"
            c={isOverdue ? 'red' : 'dimmed'}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </Tooltip>
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
  )
}
