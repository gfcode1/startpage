import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { GfIcon } from '../iconSystem'
import { getAllWidgets, getDefaultLayout, type WidgetDef, type WidgetLayout } from '../widgetRegistry'
import { WidgetOptionsProvider } from '../WidgetOptionsContext'
import { WidgetOptionsPopup } from './WidgetOptionsPopup'
import { WidgetPickerDialog } from './WidgetPickerDialog'
import { useAppStorage } from '../persistence/useAppStorage'
import { useFlipAnimation } from '../hooks/useFlipAnimation'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './WidgetGrid.css'

interface WidgetConfig {
  activeWidgets: string[]
  layout: Record<string, WidgetLayout>
  _appWidgetsInited?: boolean
}

const ROW_HEIGHT = 120

function ResizeHandle({
  widgetId,
  layout,
  gridRef,
  onResize,
  onResizeEnd,
}: {
  widgetId: string
  layout: WidgetLayout
  gridRef: React.RefObject<HTMLDivElement | null>
  onResize: (id: string, l: WidgetLayout) => void
  onResizeEnd: (id: string, l: WidgetLayout) => void
}) {
  const currentLayout = useRef(layout)

  useEffect(() => {
    currentLayout.current = layout
  }, [layout])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const el = gridRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const colCount = style.gridTemplateColumns.split(' ').length
    const gap = parseFloat(style.gap) || 0
    const cellW = (rect.width - gap * (colCount - 1)) / colCount

    const startX = e.clientX
    const startY = e.clientY
    const startW = currentLayout.current.w
    const startH = currentLayout.current.h

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    target.classList.add('gf-widget-card__resize-handle--active')

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const newW = Math.max(1, Math.min(colCount, startW + Math.round(dx / cellW)))
      const newH = Math.max(1, Math.min(4, startH + Math.round(dy / ROW_HEIGHT)))
      currentLayout.current = { w: newW, h: newH }
      onResize(widgetId, { w: newW, h: newH })
    }

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId)
      target.classList.remove('gf-widget-card__resize-handle--active')
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      onResizeEnd(widgetId, currentLayout.current)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }, [widgetId, gridRef, onResize, onResizeEnd])

  return (
    <div
      className="gf-widget-card__resize-handle"
      onPointerDown={handlePointerDown}
      aria-label="Resize widget"
      title="Drag to resize"
    />
  )
}

function SystemWidgetCard({
  widget,
  layout,
  gridRef,
  onRemove,
  onOptions,
  onResize,
  onResizeEnd,
}: {
  widget: WidgetDef
  layout: WidgetLayout
  gridRef: React.RefObject<HTMLDivElement | null>
  onRemove: () => void
  onOptions: () => void
  onResize: (id: string, l: WidgetLayout) => void
  onResizeEnd: (id: string, l: WidgetLayout) => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      className={`gf-widget-card gf-widget-card--${widget.size} gf-widget-card--system`}
      data-flip-id={widget.id}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ gridColumn: `span ${layout.w}`, gridRow: `span ${layout.h}` }}
    >
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
        aria-label={`Hide ${widget.name} widget`}
        title="Hide widget"
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
      <ResizeHandle
        widgetId={widget.id}
        layout={layout}
        gridRef={gridRef}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    </div>
  )
}

function SortableWidgetCard({
  widget,
  layout,
  gridRef,
  onRemove,
  onOptions,
  onResize,
  onResizeEnd,
}: {
  widget: WidgetDef
  layout: WidgetLayout
  gridRef: React.RefObject<HTMLDivElement | null>
  onRemove: () => void
  onOptions: () => void
  onResize: (id: string, l: WidgetLayout) => void
  onResizeEnd: (id: string, l: WidgetLayout) => void
}) {
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
    gridColumn: `span ${layout.w}`,
    gridRow: `span ${layout.h}`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gf-widget-card gf-widget-card--${widget.size}${isDragging ? ' gf-widget-card--dragging' : ''}`}
      data-flip-id={widget.id}
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
      <ResizeHandle
        widgetId={widget.id}
        layout={layout}
        gridRef={gridRef}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    </div>
  )
}

export function WidgetGrid() {
  const [config, setConfig] = useAppStorage<WidgetConfig>('_framework', 'widgetConfig', {
    activeWidgets: ['clock', 'quicknote', 'search'],
    layout: {},
  })
  const [showPicker, setShowPicker] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [optionsWidgetId, setOptionsWidgetId] = useState<string | null>(null)
  const [resizingLayouts, setResizingLayouts] = useState<Record<string, WidgetLayout> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const allWidgets = useMemo(() => getAllWidgets(), [])

  useFlipAnimation(gridRef, [config.activeWidgets])

  const getWidgetLayout = useCallback((def: WidgetDef): WidgetLayout => {
    return resizingLayouts?.[def.id] ?? config.layout?.[def.id] ?? getDefaultLayout(def.size)
  }, [config.layout, resizingLayouts])

  useEffect(() => {
    if (config._appWidgetsInited) return

    const autoIds = allWidgets
      .filter(w => w.defaultActive)
      .map(w => w.id)
    const uniq = [...new Set(autoIds)]
    const missing = uniq.filter(id => !config.activeWidgets.includes(id))

    const currentLayout = config.layout ?? {}
    const patches: Partial<WidgetConfig> = { _appWidgetsInited: true }
    if (missing.length > 0) {
      patches.activeWidgets = [...config.activeWidgets, ...missing]
    }

    const layoutPatches: Record<string, WidgetLayout> = {}
    for (const id of (patches.activeWidgets ?? config.activeWidgets)) {
      if (!currentLayout[id]) {
        const def = allWidgets.find(w => w.id === id)
        if (def) layoutPatches[id] = getDefaultLayout(def.size)
      }
    }
    patches.layout = { ...currentLayout, ...layoutPatches }

    setConfig(prev => ({ ...prev, ...patches } as WidgetConfig))
  }, [allWidgets, config.activeWidgets, config.layout, config._appWidgetsInited, setConfig])

  const handleResize = useCallback((id: string, layout: WidgetLayout) => {
    setResizingLayouts(prev => ({ ...prev, [id]: layout }))
  }, [])

  const handleResizeEnd = useCallback((id: string, layout: WidgetLayout) => {
    setResizingLayouts(prev => {
      if (!prev) return null
      const next = { ...prev }
      delete next[id]
      return Object.keys(next).length > 0 ? next : null
    })
    setConfig(prev => ({
      ...prev,
      layout: { ...(prev.layout ?? {}), [id]: layout },
    }))
  }, [setConfig])

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

  const systemActive = useMemo(() => active.filter(w => w.category === 'system'), [active])
  const sortableActive = useMemo(() => active.filter(w => w.category !== 'system'), [active])
  const sortableIds = useMemo(() => sortableActive.map(w => w.id), [sortableActive])

  const inactive = useMemo(() => allWidgets.filter(
    w => !config.activeWidgets.includes(w.id)
  ), [allWidgets, config.activeWidgets])

  const addWidget = (id: string) => {
    setConfig(prev => {
      const def = allWidgets.find(w => w.id === id)
      const layout = def ? getDefaultLayout(def.size) : { w: 2, h: 1 }
      return {
        ...prev,
        activeWidgets: [...prev.activeWidgets, id],
        layout: { ...(prev.layout ?? {}), [id]: layout },
      }
    })
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

  const showEmpty = systemActive.length === 0 && sortableActive.length === 0

  return (
    <WidgetOptionsProvider>
      <section className="gf-widgets" aria-label="Widgets">
        {showEmpty && inactive.length > 0 && (
          <div className="gf-widgets__empty">
            <GfIcon name="grid" size={24} />
            <p className="gf-widgets__empty-text">No widgets active</p>
            <p className="gf-widgets__empty-hint">Click + to add widgets to your dashboard</p>
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="gf-widgets__grid" ref={gridRef}>
            {systemActive.map(widget => (
              <SystemWidgetCard
                key={widget.id}
                widget={widget}
                layout={getWidgetLayout(widget)}
                gridRef={gridRef}
                onRemove={() => removeWidget(widget.id)}
                onOptions={() => setOptionsWidgetId(widget.id)}
                onResize={handleResize}
                onResizeEnd={handleResizeEnd}
              />
            ))}

            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              {sortableActive.map(widget => (
                <SortableWidgetCard
                  key={widget.id}
                  widget={widget}
                  layout={getWidgetLayout(widget)}
                  gridRef={gridRef}
                  onRemove={() => removeWidget(widget.id)}
                  onOptions={() => setOptionsWidgetId(widget.id)}
                  onResize={handleResize}
                  onResizeEnd={handleResizeEnd}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeWidget ? (
              <div className="gf-widget-card gf-widget-card--overlay">
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
          <div className="gf-widgets__add">
            <button
              className="gf-widgets__add-btn"
              onClick={() => setShowPicker(true)}
              aria-label="Add widget"
              title="Add widget"
            >
              <GfIcon name="plus" size={16} />
            </button>
          </div>
        )}
      </section>

      <WidgetPickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addWidget}
        inactiveWidgets={inactive}
      />

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
