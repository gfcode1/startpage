import { useNavigate } from 'react-router-dom'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './TodoWidget.css'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: string
}

interface TodoList {
  name: string
  items: TodoItem[]
}

export default function TodoWidget() {
  const navigate = useNavigate()
  const [data] = useAppStorage<TodoList | null>('todo', 'list', null)

  if (!data || data.items.length === 0) {
    return (
      <div className="gf-widget-todo">
        <button className="gf-widget-todo__action" onClick={() => navigate('/todo')}>
          Add tasks in Todo
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 3l4 4-4 4" />
          </svg>
        </button>
      </div>
    )
  }

  const total = data.items.length
  const done = data.items.filter(i => i.completed).length
  const pending = data.items.filter(i => !i.completed).slice(0, 3)

  return (
    <div className="gf-widget-todo">
      <div className="gf-widget-todo__header">
        <span className="gf-widget-todo__count">{done}/{total} done</span>
        <button className="gf-widget-todo__open" onClick={() => navigate('/todo')} aria-label="Open Todo">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </button>
      </div>
      <ul className="gf-widget-todo__list">
        {pending.map(t => (
          <li key={t.id} className="gf-widget-todo__item">
            <span className="gf-widget-todo__bullet" />
            <span className="gf-widget-todo__text">{t.text}</span>
          </li>
        ))}
      </ul>
      {pending.length < total - done && (
        <span className="gf-widget-todo__more">+{total - done - pending.length} more</span>
      )}
    </div>
  )
}
