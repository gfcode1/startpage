import { useState } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './LinksWidget.css'

interface LinkItem { id: string; label: string; url: string }

export default function LinksWidget() {
  const [links, setLinks] = useAppStorage<LinkItem[]>('linkswidget', 'links', [])
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')

  if (links.length === 0 && !editing) {
    return (
      <div className="gf-widget-links">
        <GfWidgetAction label="Add shortcuts in widget options" onClick={() => setEditing(true)} />
      </div>
    )
  }

  function addLink() {
    if (!editLabel.trim() || !editUrl.trim()) return
    const id = Date.now().toString()
    const url = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`
    setLinks([...links, { id, label: editLabel.trim(), url }])
    setEditLabel('')
    setEditUrl('')
    setEditing(false)
  }

  function removeLink(id: string) {
    setLinks(links.filter(l => l.id !== id))
  }

  return (
    <div className="gf-widget-links">
      <div className="gf-widget-links__header">
        <GfIcon name="link-2" size={14} />
        <span className="gf-widget-links__label">Shortcuts</span>
        <button className="gf-widget-links__add-btn" onClick={() => setEditing(true)} aria-label="Add link">
          <GfIcon name="plus" size={14} />
        </button>
      </div>

      {editing && (
        <div className="gf-widget-links__form">
          <input
            className="gf-widget-links__input"
            placeholder="Label"
            value={editLabel}
            onChange={e => setEditLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
          />
          <input
            className="gf-widget-links__input"
            placeholder="URL"
            value={editUrl}
            onChange={e => setEditUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
          />
          <div className="gf-widget-links__form-actions">
            <button className="gf-widget-links__save" onClick={addLink}>Save</button>
            <button className="gf-widget-links__cancel" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="gf-widget-links__grid">
        {links.map(l => (
          <div key={l.id} className="gf-widget-links__item">
            <a
              className="gf-widget-links__link"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              title={l.url}
            >
              <span className="gf-widget-links__link-label">{l.label}</span>
            </a>
            <button className="gf-widget-links__remove" onClick={() => removeLink(l.id)} aria-label={`Remove ${l.label}`}>
              <GfIcon name="close" size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
