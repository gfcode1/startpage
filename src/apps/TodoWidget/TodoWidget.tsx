import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
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
          <GfIcon name="chevron-right" size={12} />
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
          <GfIcon name="chevron-right" size={14} />
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
