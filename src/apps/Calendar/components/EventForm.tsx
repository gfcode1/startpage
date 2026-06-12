import { useState, useCallback } from 'react'
import { GfButton } from '../../../framework/components/Button'
import { CATEGORIES, type EventCategory, type CalendarEvent } from '../types'

interface EventFormProps {
  event: CalendarEvent | null
  defaultDate: string
  onSave: (event: Partial<CalendarEvent> & { title: string; startDate: string }) => void
  onDelete: () => void
  onClose: () => void
}

export function EventForm({ event, defaultDate, onSave, onDelete, onClose }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [startDate, setStartDate] = useState(event?.startDate ?? defaultDate)
  const [endDate, setEndDate] = useState(event?.endDate ?? defaultDate)
  const [startTime, setStartTime] = useState(event?.startTime ?? '')
  const [endTime, setEndTime] = useState(event?.endTime ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [category, setCategory] = useState<EventCategory>(event?.category ?? 'personal')
  const [notes, setNotes] = useState(event?.notes ?? '')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      category,
      notes,
    })
  }, [title, startDate, endDate, startTime, endTime, allDay, category, notes, onSave])

  return (
    <form className="gf-calendar__event-form" onSubmit={handleSubmit}>
      <div className="gf-calendar__form-field">
        <input
          className="gf-calendar__form-input"
          placeholder="Event title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="gf-calendar__form-row">
        <div className="gf-calendar__form-field">
          <label className="gf-calendar__form-label">Start Date</label>
          <input
            className="gf-calendar__form-input"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="gf-calendar__form-field">
          <label className="gf-calendar__form-label">End Date</label>
          <input
            className="gf-calendar__form-input"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {!allDay && (
        <div className="gf-calendar__form-row">
          <div className="gf-calendar__form-field">
            <label className="gf-calendar__form-label">Start Time</label>
            <input
              className="gf-calendar__form-input"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>
          <div className="gf-calendar__form-field">
            <label className="gf-calendar__form-label">End Time</label>
            <input
              className="gf-calendar__form-input"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>
        </div>
      )}

      <label className="gf-calendar__form-checkbox">
        <input
          type="checkbox"
          checked={allDay}
          onChange={e => setAllDay(e.target.checked)}
        />
        All day
      </label>

      <div className="gf-calendar__form-field">
        <label className="gf-calendar__form-label">Category</label>
        <div className="gf-calendar__form-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              className={`gf-calendar__form-cat-btn${category === cat.value ? ' gf-calendar__form-cat-btn--active' : ''}`}
              style={{ background: cat.color }}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gf-calendar__form-field">
        <label className="gf-calendar__form-label">Notes</label>
        <textarea
          className="gf-calendar__form-input gf-calendar__form-textarea"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="gf-calendar__form-actions">
        <GfButton variant="ghost" size="md" type="button" onClick={onClose}>
          Cancel
        </GfButton>
        <GfButton variant="primary" size="md" type="submit">
          {event ? 'Update' : 'Create'}
        </GfButton>
        {event && (
          <GfButton variant="secondary" size="md" type="button" onClick={onDelete}>
            Delete
          </GfButton>
        )}
      </div>
    </form>
  )
}
