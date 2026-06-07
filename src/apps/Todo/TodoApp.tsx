import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { useFlipAnimation } from '../../framework/hooks/useFlipAnimation'
import { useAppBadge } from '../../framework/AppBadgeContext'
import { generateId, formatRelativeTime, formatDate } from './utils'
import type { TodoItem, FilterMode, Priority } from './types'
import './TodoApp.css'

const APP_ID = 'todo'
const STORAGE_KEY = 'list'

const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: 'medium',
  medium: 'high',
  high: 'low',
}

function initialList() {
  return {
    name: 'My Todo List',
    items: [] as TodoItem[],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function TodoApp() {
  const [list, setList] = useAppStorage(APP_ID, STORAGE_KEY, initialList())
  const [newTodoText, setNewTodoText] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { setBadge } = useAppBadge('todo')

  const filteredItems = useMemo(() => {
    let items = list.items
    if (filter === 'active') items = items.filter(i => !i.completed)
    if (filter === 'completed') items = items.filter(i => i.completed)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i => i.text.toLowerCase().includes(q))
    }
    return [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.createdAt - a.createdAt
    })
  }, [list.items, filter, search])

  const stats = useMemo(() => {
    const total = list.items.length
    const completed = list.items.filter(i => i.completed).length
    const active = total - completed
    return { total, completed, active }
  }, [list.items])

  useFlipAnimation(listRef, [filteredItems])

  useEffect(() => {
    setBadge(stats.active > 0 ? stats.active : null)
  }, [stats.active, setBadge])

  const updateItems = useCallback(
    (updater: (prev: TodoItem[]) => TodoItem[]) => {
      setList(prev => ({
        ...prev,
        items: updater(prev.items),
        updatedAt: Date.now(),
      }))
    },
    [setList],
  )

  const handleAdd = useCallback(() => {
    const text = newTodoText.trim()
    if (!text) return
    const item: TodoItem = {
      id: generateId(),
      text,
      completed: false,
      priority: 'medium',
      createdAt: Date.now(),
      completedAt: null,
    }
    updateItems(prev => [item, ...prev])
    setNewTodoText('')
    inputRef.current?.focus()
    addToast('Task added', 'success')
  }, [newTodoText, updateItems, addToast])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd()
    },
    [handleAdd],
  )

  const handleToggle = useCallback(
    (id: string) => {
      updateItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                completed: !item.completed,
                completedAt: item.completed ? null : Date.now(),
              }
            : item,
        ),
      )
    },
    [updateItems],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      updateItems(prev => prev.filter(i => i.id !== id))
      addToast('Task deleted', 'error')
    },
    [updateItems, addToast],
  )

  const handleStartEdit = useCallback((item: TodoItem) => {
    setEditingId(item.id)
    setEditText(item.text)
  }, [])

  const handleFinishEdit = useCallback(() => {
    if (editingId && editText.trim()) {
      updateItems(prev =>
        prev.map(i =>
          i.id === editingId ? { ...i, text: editText.trim() } : i,
        ),
      )
    }
    setEditingId(null)
    setEditText('')
  }, [editingId, editText, updateItems])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleFinishEdit()
      if (e.key === 'Escape') setEditingId(null)
    },
    [handleFinishEdit],
  )

  const handleSetPriority = useCallback(
    (id: string, priority: Priority) => {
      updateItems(prev =>
        prev.map(i => (i.id === id ? { ...i, priority } : i)),
      )
    },
    [updateItems],
  )

  const handleClearCompleted = useCallback(() => {
    const count = list.items.filter(i => i.completed).length
    if (count === 0) return
    updateItems(prev => prev.filter(i => !i.completed))
    addToast(`Cleared ${count} completed task${count > 1 ? 's' : ''}`, 'info')
  }, [list.items, updateItems, addToast])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null)
          return
        }
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editingId])

  const segmentOptions = [
    { value: 'all', label: `All (${stats.total})` },
    { value: 'active', label: `Active (${stats.active})` },
    { value: 'completed', label: `Done (${stats.completed})` },
  ]

  return (
    <div className="gf-todo">
      <AppHeader
        title={list.name}
        badge={`${stats.active} active`}
        segments={segmentOptions}
        segmentValue={filter}
        onSegmentChange={v => setFilter(v as FilterMode)}
        searchPlaceholder="Search tasks..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="gf-todo__add">
        <input
          ref={inputRef}
          className="gf-todo__add-input"
          type="text"
          value={newTodoText}
          onChange={e => setNewTodoText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          aria-label="Add a new task"
          autoFocus
        />
        <button
          className="gf-todo__btn gf-todo__btn--primary"
          onClick={handleAdd}
          disabled={!newTodoText.trim()}
          aria-label="Add task"
        >
          <GfIcon name="plus" size={16} />
        </button>
      </div>

      {filteredItems.length === 0 && (
        <div className="gf-todo__empty">
          <GfIcon name="checklist" size={40} />
          {search ? (
            <p>No tasks match &ldquo;{search}&rdquo;</p>
          ) : filter === 'completed' ? (
            <p>No completed tasks yet</p>
          ) : filter === 'active' ? (
            <p>All tasks are done!</p>
          ) : (
            <>
              <p>No tasks yet</p>
              <span className="gf-todo__empty-hint">
                Type above and press Enter to add a task
              </span>
            </>
          )}
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="gf-todo__list" ref={listRef}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              data-flip-id={item.id}
              className={`gf-todo__item ${item.completed ? 'gf-todo__item--completed' : ''} gf-todo__item--${item.priority}`}
            >
              <button
                className="gf-todo__checkbox"
                onClick={() => handleToggle(item.id)}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed ? <GfIcon name="check" size={18} /> : <span className="gf-todo__checkbox-empty" />}
              </button>

              {editingId === item.id ? (
                <input
                  className="gf-todo__edit-input"
                  type="text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleFinishEdit}
                  autoFocus
                />
              ) : (
                <span
                  className="gf-todo__text"
                  onDoubleClick={() => handleStartEdit(item)}
                >
                  {item.text}
                </span>
              )}

              <div className="gf-todo__meta">
                <button
                  className={`gf-todo__priority-btn gf-todo__priority-btn--${item.priority}`}
                  onClick={() =>
                    handleSetPriority(item.id, PRIORITY_CYCLE[item.priority])
                  }
                  title={`Priority: ${item.priority}`}
                  aria-label={`Priority: ${item.priority}. Click to change.`}
                >
                  {item.priority === 'high'
                    ? '!!'
                    : item.priority === 'medium'
                      ? '!'
                      : '\u00B7'}
                </button>

                <span
                  className="gf-todo__time"
                  title={formatDate(item.createdAt)}
                >
                  {item.completedAt
                    ? `Done ${formatRelativeTime(item.completedAt)}`
                    : formatRelativeTime(item.createdAt)}
                </span>

                <button
                  className="gf-todo__delete-btn"
                  onClick={e => handleDelete(e, item.id)}
                  aria-label="Delete task"
                >
                  <GfIcon name="close" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.completed > 0 && (
        <div className="gf-todo__footer">
          <button
            className="gf-todo__btn gf-todo__btn--clear"
            onClick={handleClearCompleted}
          >
            Clear {stats.completed} completed
          </button>
        </div>
      )}
    </div>
  )
}
