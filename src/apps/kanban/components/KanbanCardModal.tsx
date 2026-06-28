import { useState } from 'react'
import { Modal, TextInput, Textarea, Select, Group, Button, MultiSelect, Stack, Text } from '@mantine/core'
import type { Card, Priority } from '../types'

interface KanbanCardModalProps {
  opened: boolean
  onClose: () => void
  onSave: (data: CardFormData) => void
  editingCard: Card | null
}

export interface CardFormData {
  title: string
  description: string
  priority: Priority
  labels: string[]
  dueDate: number | null
  assignee: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const SUGGESTED_LABELS = ['bug', 'feature', 'enhancement', 'docs', 'design', 'question', 'urgent']

function FormContent({ card, onSave, onClose }: { card: Card | null; onSave: (data: CardFormData) => void; onClose: () => void }) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'medium')
  const [labels, setLabels] = useState<string[]>(card?.labels ?? [])
  const [dueDate, setDueDate] = useState(card?.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : '')
  const [assignee, setAssignee] = useState(card?.assignee ?? '')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      labels,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      assignee: assignee.trim(),
    })
    onClose()
  }

  return (
    <Stack gap="sm">
      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        autoFocus
        required
      />
      <Stack gap={4}>
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          autosize
          minRows={2}
        />
        <Text size="xs" c="dimmed">Supports **bold**, *italic* and [links](url)</Text>
      </Stack>
      <Group grow>
        <Select
          label="Priority"
          data={PRIORITY_OPTIONS}
          value={priority}
          onChange={(v) => v && setPriority(v as Priority)}
        />
        <TextInput
          label="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.currentTarget.value)}
          placeholder="Name"
        />
      </Group>
      <TextInput
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.currentTarget.value)}
      />
      <MultiSelect
        label="Labels"
        data={SUGGESTED_LABELS}
        value={labels}
        onChange={(v) => setLabels(v ?? [])}
        placeholder="Select labels"
        searchable
        clearable
      />
      <Group justify="flex-end" mt="md">
        <Button variant="subtle" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </Group>
    </Stack>
  )
}

export function KanbanCardModal({ opened, onClose, onSave, editingCard }: KanbanCardModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingCard ? 'Edit Card' : 'New Card'}
      size="md"
    >
      <FormContent key={editingCard?.id ?? 'new'} card={editingCard} onSave={onSave} onClose={onClose} />
    </Modal>
  )
}
