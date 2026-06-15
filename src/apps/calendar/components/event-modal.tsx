import { useState } from 'react'
import {
  Modal, TextInput, Textarea, Button, Group, Switch, ColorInput, Select,
} from '@mantine/core'
import { useCalendarStore } from '../store'
import type { CalendarEvent } from '../types'

interface EventModalProps {
  opened: boolean
  onClose: () => void
  editingEvent: CalendarEvent | null
  selectedDate: string | null
  defaultTime?: string
}

export function EventModal({ opened, onClose, editingEvent, selectedDate, defaultTime }: EventModalProps) {
  const addEvent = useCalendarStore((s) => s.addEvent)
  const updateEvent = useCalendarStore((s) => s.updateEvent)
  const deleteEvent = useCalendarStore((s) => s.deleteEvent)
  const categories = useCalendarStore((s) => s.categories)

  const modalKey = editingEvent?.id ?? `${selectedDate}-new`

  return (
    <Modal
      key={modalKey}
      opened={opened}
      onClose={onClose}
      title={editingEvent ? 'Edit Event' : 'New Event'}
      size="sm"
    >
      <EventForm
        editingEvent={editingEvent}
        selectedDate={selectedDate}
        categories={categories}
        defaultTime={defaultTime}
        onSave={(data) => {
          if (editingEvent) {
            updateEvent(editingEvent.id, data)
          } else {
            addEvent(data)
          }
          onClose()
        }}
        onDelete={() => {
          if (editingEvent) {
            deleteEvent(editingEvent.id)
            onClose()
          }
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}

function EventForm({
  editingEvent, selectedDate, categories, defaultTime, onSave, onDelete, onCancel,
}: {
  editingEvent: CalendarEvent | null
  selectedDate: string | null
  categories: { id: string; name: string; color: string }[]
  defaultTime?: string
  onSave: (data: Omit<CalendarEvent, 'id'>) => void
  onDelete: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(editingEvent?.title ?? '')
  const [time, setTime] = useState(editingEvent?.time ?? defaultTime ?? '')
  const [duration, setDuration] = useState(editingEvent?.duration ?? 60)
  const [notes, setNotes] = useState(editingEvent?.notes ?? '')
  const [color, setColor] = useState(editingEvent?.color ?? '#d4763a')
  const [allDay, setAllDay] = useState(editingEvent ? !editingEvent.time : true)
  const [categoryId, setCategoryId] = useState<string | null>(editingEvent?.categoryId ?? null)
  const [saving, setSaving] = useState(false)

  const catOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  function handleSave() {
    if (!title.trim() || !selectedDate || saving) return
    setSaving(true)
    onSave({
      title: title.trim(),
      date: selectedDate,
      time: allDay ? undefined : time,
      duration: allDay ? undefined : duration,
      notes: notes.trim() || undefined,
      color,
      allDay,
      categoryId: categoryId || undefined,
    })
  }

  return (
    <>
      <TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} mb="sm" autoFocus />
      <TextInput label="Date" value={selectedDate ?? ''} disabled mb="sm" />
      <Switch label="All day" checked={allDay} onChange={(e) => setAllDay(e.currentTarget.checked)} mb="sm" />
      {!allDay && (
        <Group grow mb="sm">
          <TextInput label="Time" type="time" value={time} onChange={(e) => setTime(e.currentTarget.value)} />
          <TextInput
            label="Duration (min)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.currentTarget.value))}
          />
        </Group>
      )}
      <Select
        label="Category"
        placeholder="None"
        data={catOptions}
        value={categoryId}
        onChange={setCategoryId}
        mb="sm"
        clearable
      />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} mb="sm" autosize minRows={2} />
      <ColorInput label="Color" value={color} onChange={setColor} mb="md" />
      <Group justify="space-between">
        {editingEvent && (
          <Button color="red" variant="light" onClick={onDelete}>Delete</Button>
        )}
        <Group ml="auto">
          <Button variant="subtle" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </Group>
      </Group>
    </>
  )
}
