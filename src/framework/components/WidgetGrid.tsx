import { Suspense, useState, useRef, useEffect } from 'react'
import { GfIcon } from '../iconSystem'
import { widgets, WidgetDef } from '../widgetRegistry'
import { useAppStorage } from '../persistence/useAppStorage'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './WidgetGrid.css'

interface WidgetConfig {
  activeWidgets: string[]
}

function SortableWidgetCard({ widget, onRemove }: { widget: WidgetDef; onRemove: () => void }) {
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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
      activeWidgets: arrayMove(prev.activeWidgets, oldIndex, newIndex),
    }))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null

  if (active.length === 0 && inactive.length === 0) return null

  return (
    <section className="gf-widgets" aria-label="Widgets">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={config.activeWidgets} strategy={rectSortingStrategy}>
          <div className="gf-widgets__grid">
            {active.map(widget => (
              <SortableWidgetCard
                key={widget.id}
                widget={widget}
                onRemove={() => removeWidget(widget.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className={`gf-widget-card gf-widget-card--${activeWidget.size} gf-widget-card--overlay`}>
              <div className="gf-widget-card__drag-handle">
                <GfIcon name="drag-handle" size={14} />
              </div>
              <div className="gf-widget-card__overlay-content">
                <GfIcon name={activeWidget.id === 'weather' ? 'sun' : activeWidget.id === 'clock' ? 'home' : activeWidget.id === 'news' ? 'rss' : activeWidget.id === 'todo' ? 'checklist' : activeWidget.id === 'quicknote' ? 'document' : activeWidget.id === 'nowplaying' ? 'music-note' : activeWidget.id === 'radiofav' ? 'heart' : activeWidget.id === 'uv' ? 'sun' : activeWidget.id === 'moon' ? 'moon-new' : activeWidget.id === 'aqi' ? 'wind' : 'sparkles'} size={16} />
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
  )
}
