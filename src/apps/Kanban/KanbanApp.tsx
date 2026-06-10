import { useState, useMemo, useCallback, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useToast } from '../../framework/ToastContext'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { useAppBadge } from '../../framework/AppBadgeContext'
import { useTopbar } from '../../framework/TopbarContext'
import { KanbanBoardComponent } from './KanbanBoard'
import { CardDetailSheet } from './CardDetailSheet'
import { BoardManager } from './BoardManager'
import { generateId, createInitialState, normalizeState, isOverdue, TAG_COLORS } from './utils'
import type { KanbanBoard, KanbanCard, KanbanState, FilterMode } from './types'
import './KanbanApp.css'

const APP_ID = 'kanban'
const STORAGE_KEY = 'state'


export default function KanbanApp() {
  const [rawState, setState] = useAppStorage(APP_ID, STORAGE_KEY, createInitialState())
  const state = useMemo(() => normalizeState(rawState), [rawState])
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [showBoardManager, setShowBoardManager] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const { addToast } = useToast()
  const { setActions, setSearch: setTopbarSearch, clearConfig } = useTopbar()
  const { setBadge } = useAppBadge('kanban')

  const activeBoard = useMemo(
    () => state.boards.find(b => b.id === state.activeBoardId),
    [state.boards, state.activeBoardId],
  )

  const filteredCards = useMemo(() => {
    if (!activeBoard) return state.cards
    let result = state.cards

    if (filter === 'completed') {
      const doneColNames = ['done', 'complete', 'completed']
      const doneColumnIds = activeBoard.columns
        .filter(c => doneColNames.includes(c.name.toLowerCase()))
        .map(c => c.id)
      const doneSet = new Set(doneColumnIds)
      result = Object.fromEntries(
        Object.entries(result).filter(([, c]) => doneSet.has(c.columnId)),
      )
    } else if (filter === 'overdue') {
      result = Object.fromEntries(
        Object.entries(result).filter(([, c]) => c.dueDate && isOverdue(c.dueDate)),
      )
    }

    if (search) {
      const q = search.toLowerCase()
      result = Object.fromEntries(
        Object.entries(result).filter(([, c]) =>
          c.title.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q)) ||
          c.assignee.toLowerCase().includes(q),
        ),
      )
    }

    return result
  }, [state.cards, activeBoard, filter, search])

  const stats = useMemo(() => {
    if (!activeBoard) return { total: 0, active: 0, overdue: 0 }
    const columns = new Set(activeBoard.columns.map(c => c.id))
    const cards = Object.values(state.cards).filter(c => columns.has(c.columnId))
    const total = cards.length
    const overdue = cards.filter(c => c.dueDate && isOverdue(c.dueDate)).length
    return { total, active: total, overdue }
  }, [state.cards, activeBoard])

  useEffect(() => {
    setBadge(stats.overdue > 0 ? stats.overdue : null)
  }, [stats.overdue, setBadge])

  const cycleFilter = useCallback(() => {
    const modes: FilterMode[] = ['all', 'overdue', 'completed']
    const idx = modes.indexOf(filter)
    setFilter(modes[(idx + 1) % modes.length])
  }, [filter])

  useEffect(() => {
    setActions([
      {
        id: 'filter',
        icon: filter === 'overdue' ? 'alert' : filter === 'completed' ? 'check' : 'checklist',
        label: `Filter: ${filter}`,
        onClick: cycleFilter,
      },
      {
        id: 'boards',
        icon: 'board',
        label: 'Manage boards',
        onClick: () => setShowBoardManager(true),
      },
      {
        id: 'tags',
        icon: 'tag',
        label: 'Manage tags',
        onClick: () => setShowTagManager(true),
      },
    ])
    setTopbarSearch({ placeholder: 'Search cards, tags or assignee...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [filter, search, cycleFilter, setActions, setTopbarSearch, clearConfig])

  const updateState = useCallback(
    (updater: (prev: KanbanState) => KanbanState) => {
      setState(prev => updater(prev as KanbanState))
    },
    [setState],
  )

  const updateCards = useCallback(
    (updater: (prev: Record<string, KanbanCard>) => Record<string, KanbanCard>) => {
      updateState(prev => ({
        ...prev,
        cards: updater(prev.cards),
        updatedAt: Date.now(),
      }))
    },
    [updateState],
  )

  const updateBoard = useCallback(
    (boardId: string) =>
      (updater: (prev: KanbanBoard) => KanbanBoard) => {
        updateState(prev => ({
          ...prev,
          boards: prev.boards.map(b => b.id === boardId ? updater(b) : b),
          updatedAt: Date.now(),
        }))
      },
    [updateState],
  )

  const handleAddBoard = useCallback((name: string) => {
    const newBoard: KanbanBoard = {
      id: generateId(),
      name,
      columns: [
        { id: generateId(), name: 'To Do', color: '#3b82f6', order: 0 },
        { id: generateId(), name: 'In Progress', color: '#f97316', order: 1 },
        { id: generateId(), name: 'Review', color: '#8b5cf6', order: 2 },
        { id: generateId(), name: 'Done', color: '#22c55e', order: 3 },
      ],
      createdAt: Date.now(),
    }
    updateState(prev => ({
      ...prev,
      boards: [...prev.boards, newBoard],
      activeBoardId: newBoard.id,
      updatedAt: Date.now(),
    }))
    addToast('Board created', 'success')
  }, [updateState, addToast])

  const handleDeleteBoard = useCallback((boardId: string) => {
    updateState(prev => {
      const remaining = prev.boards.filter(b => b.id !== boardId)
      if (remaining.length === 0) return prev
      const newActiveId = prev.activeBoardId === boardId ? remaining[0].id : prev.activeBoardId
      const boardColumnIds = new Set(prev.boards.find(b => b.id === boardId)?.columns.map(c => c.id) || [])
      const newCards = { ...prev.cards }
      for (const key of Object.keys(newCards)) {
        if (boardColumnIds.has(newCards[key].columnId)) {
          delete newCards[key]
        }
      }
      return {
        ...prev,
        boards: remaining,
        activeBoardId: newActiveId,
        cards: newCards,
        updatedAt: Date.now(),
      }
    })
    addToast('Board deleted', 'error')
  }, [updateState, addToast])

  const handleSelectBoard = useCallback((boardId: string) => {
    updateState(prev => ({ ...prev, activeBoardId: boardId, updatedAt: Date.now() }))
  }, [updateState])

  const handleSaveCard = useCallback((card: KanbanCard) => {
    updateCards(prev => ({
      ...prev,
      [card.id]: card,
    }))
    addToast('Card updated', 'success')
  }, [updateCards, addToast])

  const handleDeleteCard = useCallback((cardId: string) => {
    updateCards(prev => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    addToast('Card deleted', 'error')
  }, [updateCards, addToast])

  const handleAddTag = useCallback(() => {
    const name = newTagName.trim()
    if (!name || state.tags.some(t => t.name === name)) return
    const color = TAG_COLORS[state.tags.length % TAG_COLORS.length]
    updateState(prev => ({
      ...prev,
      tags: [...prev.tags, { name, color }],
      updatedAt: Date.now(),
    }))
    setNewTagName('')
  }, [newTagName, state.tags, updateState])

  const handleDeleteTag = useCallback((tagName: string) => {
    updateState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.name !== tagName),
      updatedAt: Date.now(),
    }))
    updateCards(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key].tags.includes(tagName)) {
          next[key] = { ...next[key], tags: next[key].tags.filter(t => t !== tagName) }
        }
      }
      return next
    })
  }, [updateState, updateCards])

  const segmentOptions = [
    { value: 'all', label: `All (${stats.total})` },
    { value: 'overdue', label: `Overdue (${stats.overdue})` },
    { value: 'completed', label: `Done` },
  ]

  if (!activeBoard) {
    return (
      <div className="gf-kanban">
        <AppHeader
          badge="0 cards"
          segments={segmentOptions}
          segmentValue={filter}
          onSegmentChange={v => setFilter(v as FilterMode)}
        />
        <GfEmptyState
          icon={<GfIcon name="board" size={24} />}
          title="No boards yet"
          description="Create your first board to get started"
        />
      </div>
    )
  }

  return (
    <div className="gf-kanban">
      <AppHeader
        badge={`${stats.overdue > 0 ? `${stats.overdue} overdue` : `${stats.total} cards`}`}
        segments={segmentOptions}
        segmentValue={filter}
        onSegmentChange={v => setFilter(v as FilterMode)}
      />

      <div className="gf-kanban__board-selector">
        {state.boards.map(board => (
          <button
            key={board.id}
            className={
              `gf-kanban__board-tab ` +
              `${board.id === state.activeBoardId ? 'gf-kanban__board-tab--active' : ''}`
            }
            onClick={() => handleSelectBoard(board.id)}
          >
            {board.name}
          </button>
        ))}
        <button
          className="gf-kanban__new-board-btn"
          onClick={() => setShowBoardManager(true)}
          aria-label="Manage boards"
          title="Manage boards"
        >
          <GfIcon name="settings" size={14} />
        </button>
      </div>

      <KanbanBoardComponent
        board={activeBoard}
        cards={filteredCards}
        tags={state.tags}
        onUpdateCards={updateCards}
        onUpdateBoard={updateBoard(activeBoard.id)}
        onCardClick={setSelectedCard}
      />

      <CardDetailSheet
        card={selectedCard}
        tags={state.tags}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />

      <BoardManager
        boards={state.boards}
        activeBoardId={state.activeBoardId}
        open={showBoardManager}
        onClose={() => setShowBoardManager(false)}
        onSelect={handleSelectBoard}
        onAdd={handleAddBoard}
        onDelete={handleDeleteBoard}
      />

      {showTagManager && (
        <div className="gf-kanban-tag-mgr" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'var(--gf-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--gf-bg-elevated)', borderRadius: 'var(--gf-radius-lg)', padding: '1.5rem', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Manage Tags</h3>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', borderRadius: 'var(--gf-radius-sm)', background: 'transparent', cursor: 'pointer', color: 'var(--gf-text-muted)' }}
                onClick={() => setShowTagManager(false)}
                aria-label="Close"
              >
                <GfIcon name="close" size={16} />
              </button>
            </div>
            <div className="gf-kanban-tag-mgr__input-row">
              <input
                className="gf-kanban-tag-mgr__input"
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
                disabled={!newTagName.trim() || state.tags.some(t => t.name === newTagName.trim())}
                aria-label="Add tag"
                style={{ width: 40, height: 40 }}
              >
                <GfIcon name="plus" size={14} />
              </button>
            </div>

            {state.tags.length === 0 && (
              <p className="gf-kanban-tag-mgr__empty">No tags yet.</p>
            )}

            <div className="gf-kanban-tag-mgr__tag-list">
              {state.tags.map(tag => (
                <div key={tag.name} className="gf-kanban-tag-mgr__tag-item">
                  <span className="gf-kanban-tag-mgr__tag-color" style={{ background: tag.color }} />
                  <span className="gf-kanban-tag-mgr__tag-name">{tag.name}</span>
                  <span className="gf-kanban-tag-mgr__tag-count">
                    {Object.values(state.cards).filter(c => c.tags.includes(tag.name)).length}
                  </span>
                  <button
                    className="gf-kanban-tag-mgr__tag-delete"
                    onClick={() => handleDeleteTag(tag.name)}
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    <GfIcon name="close" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
