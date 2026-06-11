import { useState, useMemo } from 'react'
import { GfIcon, type IconName } from '../iconSystem'
import { GfBottomSheet } from './BottomSheet'
import type { WidgetDef, WidgetCategory } from '../widgetRegistry'
import './WidgetPickerDialog.css'

const WIDGET_ICONS: Record<string, IconName> = {
  search: 'search',
  clock: 'timer',
  quicknote: 'document',
  quote: 'sparkles',
  highscore: 'trophy',
  countdown: 'timer',
  links: 'link-2',
  calculator: 'calculator',
  worldclock: 'globe',
  wordofday: 'book-open',
  password: 'hash',
  'hackernews-top': 'news',
  'recent-notes': 'document',
  todo: 'checklist',
  pomodoro: 'timer',
  news: 'rss',
  radiofav: 'radio',
  weather: 'sun',
  uv: 'sun',
  moon: 'moon',
  aqi: 'wind',
  'youtube-nowplaying': 'headphones',
  'somafm-nowplaying': 'headphones',
  'moodist-nowplaying': 'headphones',
  'wikionthisday': 'calendar',
  'wikididyouknow': 'book-open',
  'wikithenews': 'news',
  kanban: 'layout-kanban',
}

function getWidgetIcon(id: string): IconName {
  return WIDGET_ICONS[id] ?? 'grid'
}

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  system: 'System',
  standard: 'Built-in',
  app: 'Apps',
}

const CATEGORY_ORDER: WidgetCategory[] = ['system', 'standard', 'app']

interface WidgetPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (widgetId: string) => void
  inactiveWidgets: WidgetDef[]
}

export function WidgetPickerDialog({ open, onClose, onSelect, inactiveWidgets }: WidgetPickerDialogProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return inactiveWidgets
    const q = query.toLowerCase()
    return inactiveWidgets.filter(w =>
      w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
    )
  }, [query, inactiveWidgets])

  const grouped = useMemo(() => {
    const groups: Record<WidgetCategory, WidgetDef[]> = { system: [], standard: [], app: [] }
    for (const w of filtered) {
      if (groups[w.category]) groups[w.category].push(w)
    }
    return groups
  }, [filtered])

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  const hasResults = CATEGORY_ORDER.some(cat => grouped[cat].length > 0)

  return (
    <GfBottomSheet open={open} onClose={onClose} title="Add Widget">
      <div className="gf-picker-dialog">
        <div className="gf-picker-dialog__search-wrap">
          <GfIcon name="search" size={14} />
          <input
            className="gf-picker-dialog__search"
            type="text"
            placeholder="Search widgets…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="gf-picker-dialog__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <GfIcon name="close" size={14} />
            </button>
          )}
        </div>

        {!hasResults ? (
          <div className="gf-picker-dialog__empty">
            <GfIcon name="grid" size={24} />
            <p>No widgets match your search</p>
          </div>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const items = grouped[cat]
            if (items.length === 0) return null
            return (
              <section key={cat} className="gf-picker-dialog__section">
                <h3 className="gf-picker-dialog__section-title">
                  {CATEGORY_LABELS[cat]}
                  <span className="gf-picker-dialog__section-count">{items.length}</span>
                </h3>
                <div className="gf-picker-dialog__grid">
                  {items.map(w => (
                    <button
                      key={w.id}
                      className="gf-picker-dialog__card"
                      onClick={() => handleSelect(w.id)}
                      aria-label={`Add ${w.name} widget`}
                    >
                      <span className="gf-picker-dialog__card-icon">
                        <GfIcon name={getWidgetIcon(w.id)} size={20} />
                      </span>
                      <span className="gf-picker-dialog__card-name">{w.name}</span>
                      <span className="gf-picker-dialog__card-desc">{w.description}</span>
                      <span className={`gf-picker-dialog__card-size gf-picker-dialog__card-size--${w.size}`}>
                        {w.size}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </GfBottomSheet>
  )
}
