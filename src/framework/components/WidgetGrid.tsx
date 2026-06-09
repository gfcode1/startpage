import { Suspense, useState, useRef, useEffect, useMemo } from 'react'
import { GfIcon } from '../iconSystem'
import { getSystemWidgets, getAllWidgets, type WidgetDef } from '../widgetRegistry'
import { WidgetOptionsProvider } from '../WidgetOptionsContext'
import { WidgetOptionsPopup } from './WidgetOptionsPopup'
import { useAppStorage } from '../persistence/useAppStorage'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './WidgetGrid.css'

interface WidgetConfig {
  activeWidgets: string[]
  _appWidgetsInited?: boolean
}

function SystemWidgetCard({ widget, onOptions }: { widget: WidgetDef; onOptions: () => void }) {
  return (
    <div className={`gf-widget-card gf-widget-card--${widget.size} gf-widget-card--system`}>
      {widget.options && (
        <button
          className="gf-widget-card__options-btn"
          onClick={onOptions}
          aria-label={`${widget.name} options`}
          title={`${widget.name} options`}
        >
          <GfIcon name="settings" size={13} />
        </button>
      )}
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

function SortableWidgetCard({ widget, onRemove, onOptions }: { widget: WidgetDef; onRemove: () => void; onOptions: () => void }) {
  const [hover, setHover] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gf-widget-card gf-widget-card--${widget.size}${isDragging ? ' gf-widget-card--dragging' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="gf-widget-card__drag-handle"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${widget.name}`}
        title="Drag to reorder"
      >
        <GfIcon name="drag-handle" size={14} />
      </div>
      {widget.options && (
        <button
          className="gf-widget-card__options-btn"
          onClick={onOptions}
          aria-label={`${widget.name} options`}
          title={`${widget.name} options`}
        >
          <GfIcon name="settings" size={13} />
        </button>
      )}
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
    activeWidgets: ['clock', 'quicknote'],
  })
  const [showPicker, setShowPicker] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [optionsWidgetId, setOptionsWidgetId] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const systemActive = useMemo(() => getSystemWidgets(), [])
  const allWidgets = useMemo(() => getAllWidgets(), [])

  useEffect(() => {
    if (config._appWidgetsInited) return

    const appIds = allWidgets
      .filter(w => w.category === 'app' && w.defaultActive)
      .map(w => w.id)
    const uniq = [...new Set(appIds)]
    const missing = uniq.filter(id => !config.activeWidgets.includes(id))
    if (missing.length > 0) {
      setConfig(prev => ({
        activeWidgets: [...prev.activeWidgets, ...missing],
        _appWidgetsInited: true,
      }))
    } else {
      setConfig(prev => ({ ...prev, _appWidgetsInited: true }))
    }
  }, [allWidgets, config.activeWidgets, config._appWidgetsInited, setConfig])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const active = useMemo(() => config.activeWidgets
    .map(id => allWidgets.find(w => w.id === id))
    .filter(Boolean) as WidgetDef[], [config.activeWidgets, allWidgets])

  const inactive = useMemo(() => allWidgets.filter(
    w => w.category !== 'system' && !config.activeWidgets.includes(w.id)
  ), [allWidgets, config.activeWidgets])

  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [showPicker])

  const addWidget = (id: string) => {
    setConfig(prev => ({ ...prev, activeWidgets: [...prev.activeWidgets, id] }))
    setShowPicker(false)
  }

  const removeWidget = (id: string) => {
    setConfig(prev => ({ ...prev, activeWidgets: prev.activeWidgets.filter(w => w !== id) }))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = config.activeWidgets.indexOf(String(active.id))
    const newIndex = config.activeWidgets.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    setConfig(prev => ({
      ...prev,
      activeWidgets: arrayMove(prev.activeWidgets, oldIndex, newIndex),
    }))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeWidget = activeId ? allWidgets.find(w => w.id === activeId) : null

  if (systemActive.length === 0 && active.length === 0 && inactive.length === 0) return null

  return (
    <WidgetOptionsProvider>
      <section className="gf-widgets" aria-label="Widgets">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="gf-widgets__grid">
            {systemActive.map(widget => (
              <SystemWidgetCard
                key={widget.id}
                widget={widget}
                onOptions={() => setOptionsWidgetId(widget.id)}
              />
            ))}

            <SortableContext items={config.activeWidgets} strategy={rectSortingStrategy}>
              {active.map(widget => (
                <SortableWidgetCard
                  key={widget.id}
                  widget={widget}
                  onRemove={() => removeWidget(widget.id)}
                  onOptions={() => setOptionsWidgetId(widget.id)}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeWidget ? (
              <div className={`gf-widget-card gf-widget-card--${activeWidget.size} gf-widget-card--overlay`}>
                <div className="gf-widget-card__drag-handle">
                  <GfIcon name="drag-handle" size={14} />
                </div>
                <div className="gf-widget-card__overlay-content">
                  <span>{activeWidget.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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

      {optionsWidgetId && (
        <WidgetOptionsPopup
          widgetId={optionsWidgetId}
          open={!!optionsWidgetId}
          onClose={() => setOptionsWidgetId(null)}
        />
      )}
    </WidgetOptionsProvider>
  )
}
