import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { GfConfirmDialog } from '../../framework/components/ConfirmDialog'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { useAppBadge } from '../../framework/AppBadgeContext'
import { useTopbar } from '../../framework/TopbarContext'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { generateId, formatRelativeTime, formatDate, formatDueDate, isOverdue, createList, createInitialAppData, normalizeAppData, getActiveList, getSortedLists } from './utils'
import type { TodoItem, FilterMode, Priority, SortMode, TagDef, TodoList, TodoAppData } from './types'
import './TodoApp.css'

const APP_ID = 'todo'
const STORAGE_KEY = 'lists'

const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: 'medium',
  medium: 'high',
  high: 'low',
}

const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function SortableItem({
  item,
  isChild,
  editingId,
  editText,
  onToggle,
  onDelete,
  onStartEdit,
  onFinishEdit,
  onEditKeyDown,
  onEditTextChange,
  onSetPriority,
  onAddSubtask,
  onTagClick,
  onSetDueDate,
  tags,
  childrenIds,
}: {
  item: TodoItem
  isChild: boolean
  editingId: string | null
  editText: string
  onToggle: (id: string) => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onStartEdit: (item: TodoItem) => void
  onFinishEdit: () => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
  onEditTextChange: (text: string) => void
  onSetPriority: (id: string, priority: Priority) => void
  onAddSubtask: (parentId: string) => void
  onTagClick: (tag: string) => void
  onSetDueDate: (id: string, dueDate: number | null) => void
  tags: TagDef[]
  childrenIds: string[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const tagLookup = useMemo(() => {
    const map = new Map(tags.map(t => [t.name, t]))
    return map
  }, [tags])

  const overdue = item.dueDate && !item.completed && isOverdue(item.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        `gf-todo__item ${item.completed ? 'gf-todo__item--completed' : ''} ` +
        `gf-todo__item--${item.priority} ${isChild ? 'gf-todo__item--child' : ''} ` +
        `${isDragging ? 'gf-todo__item--dragging' : ''} ` +
        `${overdue ? 'gf-todo__item--overdue' : ''}`
      }
    >
      <div className="gf-todo__drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        <GfIcon name="drag-handle" size={12} />
      </div>

      <button
        className="gf-todo__checkbox"
        onClick={() => onToggle(item.id)}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.completed ? <GfIcon name="check" size={18} /> : <span className="gf-todo__checkbox-empty" />}
      </button>

      <div className="gf-todo__body">
        {editingId === item.id ? (
          <input
            className="gf-todo__edit-input"
            type="text"
            value={editText}
            onChange={e => onEditTextChange(e.target.value)}
            onKeyDown={onEditKeyDown}
            onBlur={onFinishEdit}
            autoFocus
          />
        ) : (
          <span
            className="gf-todo__text"
            onDoubleClick={() => onStartEdit(item)}
          >
            {item.text}
          </span>
        )}

        <div className="gf-todo__item-footer">
          {item.tags.length > 0 && (
            <div className="gf-todo__tags">
              {item.tags.map(tag => {
                const def = tagLookup.get(tag)
                return (
                  <button
                    key={tag}
                    className="gf-todo__tag-chip"
                    style={{ '--tag-color': def?.color || '#888' } as React.CSSProperties}
                    onClick={() => onTagClick(tag)}
                    title={`Filter by "${tag}"`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}

          {item.dueDate && (
            <span
              className={`gf-todo__due ${overdue ? 'gf-todo__due--overdue' : ''}`}
              title={formatDate(item.dueDate)}
            >
              <GfIcon name="calendar" size={10} />
              {formatDueDate(item.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="gf-todo__meta">
        <button
          className="gf-todo__due-btn"
          onClick={() => {
            const current = new Date()
            const existing = item.dueDate ? new Date(item.dueDate) : current
            const dateStr = existing.toISOString().split('T')[0]
            const input = document.createElement('input')
            input.type = 'date'
            input.value = dateStr
            input.style.position = 'fixed'
            input.style.opacity = '0'
            input.style.pointerEvents = 'none'
            document.body.appendChild(input)

            const cleanup = () => {
              if (input.parentNode) document.body.removeChild(input)
            }

            input.addEventListener('input', () => {
              if (input.value) {
                const d = new Date(input.value + 'T12:00:00')
                onSetDueDate(item.id, d.getTime())
              }
              cleanup()
            })
            input.addEventListener('blur', cleanup)

            try {
              input.showPicker()
            } catch {
              cleanup()
            }
          }}
          aria-label="Set due date"
          title="Set due date"
        >
          {item.dueDate ? <GfIcon name="calendar" size={12} /> : <GfIcon name="calendar" size={12} />}
        </button>

        <button
          className="gf-todo__subtask-btn"
          onClick={() => onAddSubtask(item.id)}
          aria-label="Add subtask"
          title="Add subtask"
        >
          <GfIcon name="plus" size={12} />
        </button>

        {childrenIds.length > 0 && (
          <span className="gf-todo__children-count" title={`${childrenIds.length} subtask${childrenIds.length > 1 ? 's' : ''}`}>
            {childrenIds.length}
          </span>
        )}

        <button
          className={`gf-todo__priority-btn gf-todo__priority-btn--${item.priority}`}
          onClick={() => onSetPriority(item.id, PRIORITY_CYCLE[item.priority])}
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
          onClick={e => onDelete(e, item.id)}
          aria-label="Delete task"
        >
          <GfIcon name="close" size={12} />
        </button>
      </div>
    </div>
  )
}

function getListStats(list: TodoList) {
  const total = list.items.length
  const completed = list.items.filter(i => i.completed).length
  const active = total - completed
  return { total, completed, active }
}

function getInitialAppData(): TodoAppData {
  try {
    const oldKey = 'gf:todo:list'
    const newKey = `gf:${APP_ID}:${STORAGE_KEY}`
    const oldVal = localStorage.getItem(oldKey)
    if (oldVal !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldVal)
      localStorage.removeItem(oldKey)
      return normalizeAppData(JSON.parse(oldVal))
    }
  } catch {
  }
  return createInitialAppData()
}

export default function TodoApp() {
  const [rawData, setData] = useAppStorage<TodoAppData>(APP_ID, STORAGE_KEY, getInitialAppData())
  const appData = useMemo(() => normalizeAppData(rawData), [rawData])
  const activeList = useMemo(() => getActiveList(appData), [appData])
  const sortedLists = useMemo(() => getSortedLists(appData), [appData])
  const [newTodoText, setNewTodoText] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const editingIdRef = useRef<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null)
  const [subtaskText, setSubtaskText] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showListManager, setShowListManager] = useState(false)
  const [listToDelete, setListToDelete] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [newListName, setNewListName] = useState('')
  const { addToast } = useToast()
  const { setActions, setSearch: setTopbarSearch, clearConfig } = useTopbar()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const subtaskInputRef = useRef<HTMLInputElement>(null)
  const { setBadge } = useAppBadge('todo')

  useEffect(() => { editingIdRef.current = editingId }, [editingId])

  const list = activeList
  const listStats = useMemo(() => sortedLists.map(l => ({ id: l.id, name: l.name, ...getListStats(l) })), [sortedLists])
  const totalActive = useMemo(() => listStats.reduce((s, l) => s + l.active, 0), [listStats])

  const cycleSort = useCallback(() => {
    const modes: SortMode[] = ['manual', 'dueDate', 'priority', 'createdAt']
    const idx = modes.indexOf(sortMode)
    setSortMode(modes[(idx + 1) % modes.length])
  }, [sortMode])

  useEffect(() => {
    setActions([
      {
        id: 'sort',
        icon: 'refresh',
        label: `Sort: ${sortMode}`,
        onClick: cycleSort,
      },
      {
        id: 'tags',
        icon: 'tag',
        label: 'Manage tags',
        onClick: () => setShowTagManager(true),
      },
      {
        id: 'lists',
      icon: 'checklist',
      label: 'Manage Lists',
        onClick: () => setShowListManager(true),
      },
    ])
    setTopbarSearch({ placeholder: 'Search tasks or tags...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, sortMode, cycleSort, setActions, setTopbarSearch, clearConfig])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const filteredItems = useMemo(() => {
    if (!list) return []
    let items = list.items
    if (filter === 'active') items = items.filter(i => !i.completed)
    if (filter === 'completed') items = items.filter(i => i.completed)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        i.text.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q)),
      )
    }
    const sorted = [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      if (sortMode === 'dueDate') {
        if (a.dueDate !== b.dueDate) return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)
      }
      if (sortMode === 'priority') {
        const p = { high: 0, medium: 1, low: 2 }
        if (a.priority !== b.priority) return p[a.priority] - p[b.priority]
      }
      if (sortMode === 'createdAt') {
        if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt
      }

      return a.order - b.order
    })
    return sorted
  }, [list, filter, search, sortMode])

  const childMap = useMemo(() => {
    if (!list) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const item of list.items) {
      if (item.parentId) {
        const existing = map.get(item.parentId) || []
        existing.push(item.id)
        map.set(item.parentId, existing)
      }
    }
    return map
  }, [list])

  const stats = useMemo(() => {
    if (!list) return { total: 0, completed: 0, active: 0 }
    return getListStats(list)
  }, [list])

  useEffect(() => {
    setBadge(totalActive > 0 ? totalActive : null)
  }, [totalActive, setBadge])

  const updateActiveList = useCallback((updater: (list: TodoList) => TodoList) => {
    setData(prev => {
      const data = normalizeAppData(prev)
      const activeList = getActiveList(data)
      if (!activeList) return data
      const idx = data.lists.findIndex(l => l.id === data.activeListId)
      if (idx === -1) return data
      const newLists = [...data.lists]
      newLists[idx] = updater({ ...newLists[idx] })
      return { ...data, lists: newLists }
    })
  }, [setData])

  const updateActiveListItems = useCallback((updater: (items: TodoItem[]) => TodoItem[]) => {
    updateActiveList(list => ({
      ...list,
      items: updater(list.items),
      updatedAt: Date.now(),
    }))
  }, [updateActiveList])

  const updateActiveListTags = useCallback((updater: (tags: TagDef[]) => TagDef[]) => {
    updateActiveList(list => ({
      ...list,
      tags: updater(list.tags),
      updatedAt: Date.now(),
    }))
  }, [updateActiveList])

  function switchList(listId: string) {
    setData(prev => {
      const data = normalizeAppData(prev)
      if (!data.lists.some(l => l.id === listId)) return data
      return { ...data, activeListId: listId }
    })
    setFilter('all')
    setSearch('')
    setNewTodoText('')
    setSubtaskParentId(null)
    setEditingId(null)
  }

  function handleCreateList() {
    const name = newListName.trim()
    if (!name) return
    const newList = createList(name)
    setData(prev => {
      const data = normalizeAppData(prev)
      return {
        activeListId: newList.id,
        lists: [...data.lists, newList],
        listOrder: [...data.listOrder, newList.id],
      }
    })
    setNewListName('')
    addToast(`List "${name}" created`, 'success')
  }

  function handleDeleteList(listId: string) {
    setData(prev => {
      const data = normalizeAppData(prev)
      if (data.lists.length <= 1) {
        addToast('Cannot delete the last list', 'error')
        return data
      }
      const newLists = data.lists.filter(l => l.id !== listId)
      const newOrder = data.listOrder.filter(id => id !== listId)
      const newActiveId = data.activeListId === listId
        ? (newOrder[0] || newLists[0]?.id || '')
        : data.activeListId
      addToast('List deleted', 'error')
      return { activeListId: newActiveId, lists: newLists, listOrder: newOrder }
    })
    setListToDelete(null)
  }

  function handleRenameList(listId: string, newName: string) {
    const name = newName.trim()
    if (!name) return
    setData(prev => {
      const data = normalizeAppData(prev)
      return {
        ...data,
        lists: data.lists.map(l => l.id === listId ? { ...l, name, updatedAt: Date.now() } : l),
      }
    })
    setRenamingId(null)
    setRenameText('')
  }

  const handleAdd = useCallback(() => {
    if (!list) return
    const text = newTodoText.trim()
    if (!text) return
    updateActiveListItems(prev => {
      const maxOrder = prev.reduce((max, i) => Math.max(max, i.order), 0)
      const item: TodoItem = {
        id: generateId(),
        text,
        completed: false,
        priority: 'medium',
        tags: [],
        parentId: null,
        dueDate: null,
        order: maxOrder + 1,
        createdAt: Date.now(),
        completedAt: null,
      }
      return [...prev, item]
    })
    setNewTodoText('')
    inputRef.current?.focus()
    addToast('Task added', 'success')
  }, [newTodoText, updateActiveListItems, addToast, list])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd()
    },
    [handleAdd],
  )

  const handleToggle = useCallback(
    (id: string) => {
      updateActiveListItems(prev =>
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
    [updateActiveListItems],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      setDeleteConfirmId(id)
    },
    [],
  )

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmId) return
    updateActiveListItems(prev => prev.filter(i => i.id !== deleteConfirmId && i.parentId !== deleteConfirmId))
    addToast('Task deleted', 'error')
    setDeleteConfirmId(null)
  }, [deleteConfirmId, updateActiveListItems, addToast])

  const handleStartEdit = useCallback((item: TodoItem) => {
    setEditingId(item.id)
    setEditText(item.text)
  }, [])

  const handleFinishEdit = useCallback(() => {
    const eid = editingIdRef.current
    if (eid && editText.trim()) {
      updateActiveListItems(prev =>
        prev.map(i =>
          i.id === eid ? { ...i, text: editText.trim() } : i,
        ),
      )
    }
    setEditingId(null)
    setEditText('')
  }, [editText, updateActiveListItems])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleFinishEdit()
      if (e.key === 'Escape') setEditingId(null)
    },
    [handleFinishEdit],
  )

  const handleSetPriority = useCallback(
    (id: string, priority: Priority) => {
      updateActiveListItems(prev =>
        prev.map(i => (i.id === id ? { ...i, priority } : i)),
      )
    },
    [updateActiveListItems],
  )

  const handleClearCompleted = useCallback(() => {
    if (!list) return
    const count = list.items.filter(i => i.completed).length
    if (count === 0) return
    updateActiveListItems(prev => prev.filter(i => !i.completed))
    addToast(`Cleared ${count} completed task${count > 1 ? 's' : ''}`, 'info')
  }, [list, updateActiveListItems, addToast])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredItems.findIndex(i => i.id === String(active.id))
    const newIndex = filteredItems.findIndex(i => i.id === String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedVisible = arrayMove(filteredItems, oldIndex, newIndex)

    updateActiveListItems(prev => {
      const allSorted = [...prev].sort((a, b) => a.order - b.order)
      const visibleSet = new Set(reorderedVisible.map(i => i.id))
      const hiddenItems = allSorted.filter(i => !visibleSet.has(i.id))

      const result: TodoItem[] = []
      let hi = 0

      for (const vis of reorderedVisible) {
        while (hi < hiddenItems.length) {
          const origHiddenIdx = allSorted.indexOf(hiddenItems[hi])
          const origVisIdx = allSorted.findIndex(s => s.id === vis.id)
          if (origHiddenIdx < origVisIdx) {
            result.push({ ...hiddenItems[hi], order: result.length })
            hi++
          } else {
            break
          }
        }
        result.push({ ...vis, order: result.length })
      }
      while (hi < hiddenItems.length) {
        result.push({ ...hiddenItems[hi], order: result.length })
        hi++
      }

      return result
    })
  }, [filteredItems, updateActiveListItems])

  const handleAddSubtask = useCallback((parentId: string) => {
    setSubtaskParentId(parentId)
    setSubtaskText('')
    setTimeout(() => subtaskInputRef.current?.focus(), 50)
  }, [])

  const handleSubmitSubtask = useCallback(() => {
    if (!subtaskParentId || !subtaskText.trim()) return
    updateActiveListItems(prev => {
      const parent = prev.find(i => i.id === subtaskParentId)
      if (!parent) return prev
      const maxOrder = prev.reduce((max, i) => Math.max(max, i.order), 0)
      const child: TodoItem = {
        id: generateId(),
        text: subtaskText.trim(),
        completed: false,
        priority: 'medium',
        tags: [],
        parentId: subtaskParentId,
        dueDate: null,
        order: maxOrder + 1,
        createdAt: Date.now(),
        completedAt: null,
      }
      return [...prev, child]
    })
    setSubtaskParentId(null)
    setSubtaskText('')
    addToast('Subtask added', 'success')
  }, [subtaskParentId, subtaskText, updateActiveListItems, addToast])

  const handleSetDueDate = useCallback((id: string, dueDate: number | null) => {
    updateActiveListItems(prev =>
      prev.map(i => (i.id === id ? { ...i, dueDate } : i)),
    )
  }, [updateActiveListItems])

  const handleAddTag = useCallback(() => {
    if (!list) return
    const name = newTagName.trim()
    if (!name || list.tags.some(t => t.name === name)) return
    const color = TAG_COLORS[list.tags.length % TAG_COLORS.length]
    updateActiveListTags(prev => [...prev, { name, color }])
    setNewTagName('')
  }, [newTagName, list, updateActiveListTags])

  const handleDeleteTag = useCallback((tagName: string) => {
    updateActiveListTags(prev => prev.filter(t => t.name !== tagName))
    updateActiveListItems(prev =>
      prev.map(i => ({
        ...i,
        tags: i.tags.filter(t => t !== tagName),
      })),
    )
  }, [updateActiveListTags, updateActiveListItems])

  const handleTagClick = useCallback((tag: string) => {
    setSearch(tag)
    setFilter('all')
  }, [])

  const subtaskParentIdRef = useRef<string | null>(null)
  useEffect(() => { subtaskParentIdRef.current = subtaskParentId }, [subtaskParentId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editingIdRef.current) {
          setEditingId(null)
          return
        }
        if (subtaskParentIdRef.current) {
          setSubtaskParentId(null)
          return
        }
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const segmentOptions = [
    { value: 'all', label: `All (${stats.total})` },
    { value: 'active', label: `Active (${stats.active})` },
    { value: 'completed', label: `Done (${stats.completed})` },
  ]

  const activeDragItem = list ? list.items.find(i => i.id === activeDragId) : null

  if (!list) {
    return (
      <div className="gf-todo">
        <AppHeader badge={`${totalActive} active`} />
        <GfEmptyState
          icon={<GfIcon name="checklist" size={24} />}
          title="No lists"
          description="Create your first list to get started"
        />
      </div>
    )
  }

  return (
    <div className="gf-todo">
      <AppHeader
        badge={`${totalActive} active across ${sortedLists.length} list${sortedLists.length > 1 ? 's' : ''}`}
        segments={segmentOptions}
        segmentValue={filter}
        onSegmentChange={v => setFilter(v as FilterMode)}
      />

      <div className="gf-todo__list-switcher">
        <div className="gf-todo__list-chips">
          {sortedLists.map(l => {
            const ls = listStats.find(s => s.id === l.id)
            const isActive = l.id === appData.activeListId
            return (
              <button
                key={l.id}
                className={`gf-todo__list-chip ${isActive ? 'gf-todo__list-chip--active' : ''}`}
                onClick={() => switchList(l.id)}
              >
                <span className="gf-todo__list-chip-name">{l.name}</span>
                {ls && ls.active > 0 && (
                  <span className="gf-todo__list-chip-count">{ls.active}</span>
                )}
              </button>
            )
          })}
          <button
            className="gf-todo__list-chip gf-todo__list-chip--add"
            onClick={() => setShowListManager(true)}
            aria-label="Manage lists"
            title="Manage lists"
          >
            <GfIcon name="plus" size={12} />
          </button>
        </div>
      </div>

      <div className="gf-todo__add">
        <input
          ref={inputRef}
          className="gf-todo__add-input"
          type="text"
          value={newTodoText}
          onChange={e => setNewTodoText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Add a task to "${list.name}"...`}
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

      {filteredItems.length === 0 && search && (
        <GfEmptyState
          icon={<GfIcon name="search" size={24} />}
          title={`No tasks match "${search}"`}
          description="Try different keywords"
        />
      )}
      {filteredItems.length === 0 && !search && filter === 'completed' && (
        <GfEmptyState
          icon={<GfIcon name="checkmark" size={24} />}
          title="No completed tasks yet"
          description="Complete a task to see it here"
        />
      )}
      {filteredItems.length === 0 && !search && filter === 'active' && (
        <GfEmptyState
          icon={<GfIcon name="checklist" size={24} />}
          title="All tasks are done!"
          description="Great job! Add more tasks if needed."
        />
      )}
      {filteredItems.length === 0 && !search && filter === 'all' && (
        <GfEmptyState
          icon={<GfIcon name="checklist" size={24} />}
          title={`"${list.name}" is empty`}
          description="Type above and press Enter to add a task"
        />
      )}

      {filteredItems.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event: DragStartEvent) => setActiveDragId(String(event.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="gf-todo__list" ref={listRef}>
              {filteredItems.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  isChild={!!item.parentId}
                  editingId={editingId}
                  editText={editText}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onStartEdit={handleStartEdit}
                  onFinishEdit={handleFinishEdit}
                  onEditKeyDown={handleEditKeyDown}
                  onEditTextChange={setEditText}
                  onSetPriority={handleSetPriority}
                  onAddSubtask={handleAddSubtask}
                  onTagClick={handleTagClick}
                  onSetDueDate={handleSetDueDate}
                  tags={list.tags}
                  childrenIds={childMap.get(item.id) || []}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragItem ? (
              <div className={`gf-todo__item gf-todo__item--${activeDragItem.priority} gf-todo__item--overlay ${activeDragItem.completed ? 'gf-todo__item--completed' : ''}`}>
                <div className="gf-todo__checkbox">
                  {activeDragItem.completed ? <GfIcon name="check" size={18} /> : <span className="gf-todo__checkbox-empty" />}
                </div>
                <div className="gf-todo__body">
                  <span className="gf-todo__text">{activeDragItem.text}</span>
                  <div className="gf-todo__item-footer">
                    {activeDragItem.tags.length > 0 && (
                      <div className="gf-todo__tags">
                        {activeDragItem.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="gf-todo__tag-chip" style={{ '--tag-color': '#888' } as React.CSSProperties}>
                            {tag}
                          </span>
                        ))}
                        {activeDragItem.tags.length > 2 && <span className="gf-todo__tag-chip">+{activeDragItem.tags.length - 2}</span>}
                      </div>
                    )}
                    {activeDragItem.dueDate && (
                      <span className={`gf-todo__due ${isOverdue(activeDragItem.dueDate) && !activeDragItem.completed ? 'gf-todo__due--overdue' : ''}`}>
                        <GfIcon name="calendar" size={10} />
                        {formatDueDate(activeDragItem.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`gf-todo__priority-btn gf-todo__priority-btn--${activeDragItem.priority}`}>
                  {activeDragItem.priority === 'high' ? '!!' : activeDragItem.priority === 'medium' ? '!' : '\u00B7'}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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

      {subtaskParentId && (
        <div className="gf-todo__subtask-input-wrap">
          <div className="gf-todo__subtask-input-inner">
            <GfIcon name="chevron-right" size={14} className="gf-todo__subtask-arrow" />
            <input
              ref={subtaskInputRef}
              className="gf-todo__subtask-input"
              type="text"
              value={subtaskText}
              onChange={e => setSubtaskText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmitSubtask()
                if (e.key === 'Escape') setSubtaskParentId(null)
              }}
              placeholder="Add a subtask..."
              aria-label="Add a subtask"
            />
            <button
              className="gf-todo__btn gf-todo__btn--primary gf-todo__subtask-submit"
              onClick={handleSubmitSubtask}
              disabled={!subtaskText.trim()}
              aria-label="Submit subtask"
            >
              <GfIcon name="check" size={14} />
            </button>
            <button
              className="gf-todo__btn gf-todo__subtask-cancel"
              onClick={() => setSubtaskParentId(null)}
              aria-label="Cancel subtask"
            >
              <GfIcon name="close" size={14} />
            </button>
          </div>
        </div>
      )}

      <GfBottomSheet
        open={showTagManager}
        onClose={() => setShowTagManager(false)}
        title="Manage Tags"
      >
        <div className="gf-todo__tag-manager">
          <div className="gf-todo__tag-input-row">
            <input
              className="gf-todo__tag-input"
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTag() }}
              placeholder="New tag name..."
              aria-label="New tag name"
            />
            <button
              className="gf-todo__btn gf-todo__btn--primary"
              onClick={handleAddTag}
              disabled={!newTagName.trim() || list.tags.some(t => t.name === newTagName.trim())}
              aria-label="Add tag"
            >
              <GfIcon name="plus" size={14} />
            </button>
          </div>

          {list.tags.length === 0 && (
            <p className="gf-todo__tag-empty">No tags yet. Create one above.</p>
          )}

          <div className="gf-todo__tag-list">
            {list.tags.map(tag => (
              <div key={tag.name} className="gf-todo__tag-item">
                <span
                  className="gf-todo__tag-dot"
                  style={{ background: tag.color }}
                />
                <span className="gf-todo__tag-name">{tag.name}</span>
                <span className="gf-todo__tag-usage">
                  {list.items.filter(i => i.tags.includes(tag.name)).length}
                </span>
                <button
                  className="gf-todo__tag-delete"
                  onClick={() => handleDeleteTag(tag.name)}
                  aria-label={`Delete tag ${tag.name}`}
                >
                  <GfIcon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </GfBottomSheet>

      <GfBottomSheet
        open={showListManager}
        onClose={() => setShowListManager(false)}
        title="Manage Lists"
      >
        <div className="gf-todo__list-manager">
          <div className="gf-todo__list-manager-input-row">
            <input
              className="gf-todo__list-manager-input"
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateList() }}
              placeholder="New list name..."
              aria-label="New list name"
            />
            <button
              className="gf-todo__btn gf-todo__btn--primary"
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              aria-label="Create list"
            >
              <GfIcon name="plus" size={14} />
            </button>
          </div>

          <div className="gf-todo__list-manager-items">
            {sortedLists.map(l => {
              const ls = listStats.find(s => s.id === l.id)
              const isRenaming = renamingId === l.id
              return (
                <div key={l.id} className="gf-todo__list-manager-item">
                  {isRenaming ? (
                    <input
                      className="gf-todo__list-manager-rename-input"
                      type="text"
                      value={renameText}
                      onChange={e => setRenameText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameList(l.id, renameText)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onBlur={() => handleRenameList(l.id, renameText)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span
                        className="gf-todo__list-manager-name"
                        onDoubleClick={() => { setRenamingId(l.id); setRenameText(l.name) }}
                      >
                        {l.name}
                      </span>
                      {ls && (
                        <span className="gf-todo__list-manager-count">
                          {ls.active} active · {ls.total} total
                        </span>
                      )}
                      <button
                        className="gf-todo__list-manager-rename-btn"
                        onClick={() => { setRenamingId(l.id); setRenameText(l.name) }}
                        aria-label={`Rename list ${l.name}`}
                      >
                        <GfIcon name="edit" size={12} />
                      </button>
                      {sortedLists.length > 1 && (
                        <button
                          className="gf-todo__list-manager-delete-btn"
                          onClick={() => setListToDelete(l.id)}
                          aria-label={`Delete list ${l.name}`}
                        >
                          <GfIcon name="close" size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </GfBottomSheet>

      <GfConfirmDialog
        open={listToDelete !== null}
        onClose={() => setListToDelete(null)}
        onConfirm={() => { if (listToDelete) handleDeleteList(listToDelete) }}
        title="Delete list?"
        message="This will permanently delete this list and all its tasks. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <GfConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete task?"
        message="This will also delete all its subtasks. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
