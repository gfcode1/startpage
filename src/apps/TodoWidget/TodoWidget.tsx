import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import type { TodoAppData } from '../Todo/types'
import { normalizeAppData, getActiveList, getSortedLists } from '../Todo/utils'
import './TodoWidget.css'

export default function TodoWidget() {
  const navigate = useNavigate()
  const [rawData, setData] = useAppStorage<TodoAppData | null>('todo', 'lists', null)
  const [widgetListId, setWidgetListId] = useAppStorage<string>('todo', 'widgetListId', '')

  const appData = useMemo(() => normalizeAppData(rawData), [rawData])
  const sortedLists = useMemo(() => getSortedLists(appData), [appData])

  const selectedListId = widgetListId && sortedLists.some(l => l.id === widgetListId)
    ? widgetListId
    : appData.activeListId

  const list = useMemo(
    () => sortedLists.find(l => l.id === selectedListId) || getActiveList(appData),
    [sortedLists, selectedListId, appData],
  )

  const handleToggle = useCallback((itemId: string) => {
    if (!list) return
    setData(prev => {
      const data = normalizeAppData(prev)
      const idx = data.lists.findIndex(l => l.id === list.id)
      if (idx === -1) return data
      const newLists = [...data.lists]
      newLists[idx] = {
        ...newLists[idx],
        items: newLists[idx].items.map(item =>
          item.id === itemId
            ? { ...item, completed: !item.completed, completedAt: item.completed ? null : Date.now() }
            : item,
        ),
        updatedAt: Date.now(),
      }
      return { ...data, lists: newLists }
    })
  }, [list, setData])

  if (sortedLists.length === 0) {
    return (
      <div className="gf-widget-todo">
        <GfWidgetAction label="Add tasks in Todo" onClick={() => navigate('/todo')} />
      </div>
    )
  }

  const total = list?.items.length ?? 0
  const done = list?.items.filter(i => i.completed).length ?? 0
  const pending = list?.items.filter(i => !i.completed) ?? []

  return (
    <div className="gf-widget-todo">
      <div className="gf-widget-todo__header">
        <div className="gf-widget-todo__header-left">
          <select
            className="gf-widget-todo__select"
            value={selectedListId}
            onChange={e => setWidgetListId(e.target.value)}
            aria-label="Select todo list"
          >
            {sortedLists.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <span className="gf-widget-todo__count">{done}/{total} done</span>
        </div>
        <button className="gf-widget-todo__open" onClick={() => navigate('/todo')} aria-label="Open Todo">
          <GfIcon name="chevron-right" size={14} />
        </button>
      </div>

      {pending.length === 0 && (
        <GfWidgetAction label="All done! Add more" onClick={() => navigate('/todo')} />
      )}

      {pending.length > 0 && (
        <ul className="gf-widget-todo__list">
          {pending.slice(0, 4).map(t => (
            <li key={t.id} className="gf-widget-todo__item">
              <button
                className="gf-widget-todo__checkbox"
                onClick={() => handleToggle(t.id)}
                aria-label={`Mark "${t.text}" as complete`}
              >
                <span className="gf-widget-todo__check-empty" />
              </button>
              <span className="gf-widget-todo__text">{t.text}</span>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 4 && (
        <span className="gf-widget-todo__more">+{pending.length - 4} more</span>
      )}
    </div>
  )
}
