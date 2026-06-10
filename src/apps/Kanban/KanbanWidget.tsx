import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { normalizeState, isOverdue } from './utils'
import type { KanbanState } from './types'

export default function KanbanWidget() {
  const navigate = useNavigate()
  const [raw] = useAppStorage<KanbanState | null>('kanban', 'state', null)
  const state = useMemo(() => raw ? normalizeState(raw) : null, [raw])

  const stats = useMemo(() => {
    if (!state) return null
    const board = state.boards.find(b => b.id === state.activeBoardId)
    if (!board) return null

    const cards = Object.values(state.cards).filter(c =>
      board.columns.some(col => col.id === c.columnId),
    )
    const total = cards.length
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const overdue = cards.filter(c => c.dueDate && isOverdue(c.dueDate)).length
    const dueToday = cards.filter(c => c.dueDate && !isOverdue(c.dueDate) && c.dueDate < today + 86400000).length

    const columnCounts: { name: string; color: string; count: number }[] = []
    for (const col of [...board.columns].sort((a, b) => a.order - b.order)) {
      const count = Object.values(state.cards).filter(c => c.columnId === col.id).length
      if (count > 0) {
        columnCounts.push({ name: col.name, color: col.color, count })
      }
    }

    const maxCount = Math.max(...columnCounts.map(c => c.count), 1)

    return { total, overdue, dueToday, columnCounts, maxCount }
  }, [state])

  if (!stats || stats.total === 0) {
    return (
      <div className="gf-widget-kanban">
        <GfWidgetAction label="Open Kanban" onClick={() => navigate('/kanban')} />
      </div>
    )
  }

  return (
    <div className="gf-widget-kanban">
      <div className="gf-widget-kanban__header">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="gf-widget-kanban__total">{stats.total} cards</span>
          {stats.overdue > 0 && (
            <span className="gf-widget-kanban__overdue">{stats.overdue} overdue</span>
          )}
        </div>
        <button className="gf-widget-kanban__open" onClick={() => navigate('/kanban')} aria-label="Open Kanban">
          <GfIcon name="chevron-right" size={14} />
        </button>
      </div>

      <div className="gf-widget-kanban__bar-chart">
        {stats.columnCounts.map(col => (
          <div key={col.name} className="gf-widget-kanban__bar-row">
            <span className="gf-widget-kanban__bar-label">{col.name}</span>
            <div className="gf-widget-kanban__bar-track">
              <div
                className="gf-widget-kanban__bar-fill"
                style={{
                  width: `${(col.count / stats.maxCount) * 100}%`,
                  background: col.color,
                }}
              />
            </div>
            <span className="gf-widget-kanban__bar-count">{col.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
