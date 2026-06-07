import { Suspense, useState, useRef, useEffect } from 'react'
import { GfIcon } from '../iconSystem'
import { widgets, WidgetDef } from '../widgetRegistry'
import { useAppStorage } from '../persistence/useAppStorage'
import './WidgetGrid.css'

interface WidgetConfig {
  activeWidgets: string[]
}

function WidgetCard({ widget, onRemove }: { widget: WidgetDef; onRemove: () => void }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className={`gf-widget-card gf-widget-card--${widget.size}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        className={`gf-widget-card__remove${hover ? ' gf-widget-card__remove--visible' : ''}`}
        onClick={onRemove}
        aria-label={`Remove ${widget.name} widget`}
        title="Remove widget"
      >
        <GfIcon name="close" size={12} />
      </button>
      <Suspense fallback={
        <div className="gf-widget-card__loading">
          <span className="gf-widget-card__loading-dot" />
        </div>
      }>
        <widget.component />
      </Suspense>
    </div>
  )
}

export function WidgetGrid() {
  const [config, setConfig] = useAppStorage<WidgetConfig>('_framework', 'widgetConfig', {
    activeWidgets: ['clock', 'weather', 'news'],
  })
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const active = config.activeWidgets
    .map(id => widgets.find(w => w.id === id))
    .filter(Boolean) as WidgetDef[]

  const inactive = widgets.filter(w => !config.activeWidgets.includes(w.id))

  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  const addWidget = (id: string) => {
    setConfig(prev => ({ activeWidgets: [...prev.activeWidgets, id] }))
    setShowPicker(false)
  }

  const removeWidget = (id: string) => {
    setConfig(prev => ({ activeWidgets: prev.activeWidgets.filter(w => w !== id) }))
  }

  if (active.length === 0 && inactive.length === 0) return null

  return (
    <section className="gf-widgets" aria-label="Widgets">
      <div className="gf-widgets__grid">
        {active.map(widget => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="gf-widgets__add" ref={pickerRef}>
          <button
            className="gf-widgets__add-btn"
            onClick={() => setShowPicker(prev => !prev)}
            aria-label="Add widget"
            title="Add widget"
          >
            <GfIcon name="plus" size={16} />
          </button>

          {showPicker && (
            <div className="gf-widgets__picker">
              {inactive.map(w => (
                <button
                  key={w.id}
                  className="gf-widgets__picker-item"
                  onClick={() => addWidget(w.id)}
                >
                  <span className="gf-widgets__picker-name">{w.name}</span>
                  <span className="gf-widgets__picker-desc">{w.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
