# Piano: Dock stile macOS

## File da modificare

1. `src/framework/WindowManager.tsx`
2. `src/framework/components/AppDock.tsx`
3. `src/framework/components/AppDock.css`

---

## 1. WindowManager.tsx — Aggiungere `getFrontmostAppId()`

### Nella `WindowManagerValue` interface (riga 21):
```typescript
getFrontmostAppId: () => string | undefined
```

### Nuovo callback dopo `getApp` (dopo riga 155):
```typescript
const getFrontmostAppId = useCallback(() => {
  if (windows.length === 0) return undefined
  const top = windows.reduce((a, b) => a.zIndex > b.zIndex ? a : b)
  return top.appId
}, [windows])
```

### Aggiungere al `value` useMemo (riga ~187):
```typescript
getFrontmostAppId,
```

---

## 2. AppDock.tsx — Riscrittura

### Nuovi import:
```typescript
import { useState, useRef, useEffect, useCallback } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

### Nuovo type per contest menu:
```typescript
interface DockContextMenu {
  appId: string
  x: number
  y: number
}
```

### Nuovo stato e ref in `AppDock`:
```typescript
const [contextMenu, setContextMenu] = useState<DockContextMenu | null>(null)
const [openingApps, setOpeningApps] = useState<Set<string>>(new Set())
const [activeDragId, setActiveDragId] = useState<string | null>(null)
const dockRef = useRef<HTMLDivElement>(null)
const [mouseX, setMouseX] = useState<number | null>(null)
```

### Click handler (sostituire onClick inline):
```typescript
const handleClick = useCallback((appId: string) => {
  const win = windows.find(w => w.appId === appId)
  if (!win) {
    openWindow(appId)
    setOpeningApps(prev => new Set(prev).add(appId))
    setTimeout(() => setOpeningApps(prev => {
      const next = new Set(prev)
      next.delete(appId)
      return next
    }), 500)
  } else if (win.state === 'minimized') {
    restoreWindow(appId)
    focusWindow(appId)
  } else if (getFrontmostAppId() === appId) {
    minimizeWindow(appId)
  } else {
    focusWindow(appId)
  }
}, [windows, openWindow, restoreWindow, focusWindow, minimizeWindow, getFrontmostAppId])
```

### Context menu handler:
```typescript
const handleContextMenu = useCallback((e: React.MouseEvent, appId: string) => {
  e.preventDefault()
  setContextMenu({ appId, x: e.clientX, y: e.clientY })
}, [])

const closeContextMenu = useCallback(() => {
  setContextMenu(null)
}, [])
```

### Chiusura context menu su click fuori / Escape:
```typescript
useEffect(() => {
  if (!contextMenu) return
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu() }
  const onClick = (e: MouseEvent) => {
    if (!(e.target as Element)?.closest('.gf-appdock__context-menu')) closeContextMenu()
  }
  document.addEventListener('keydown', onKey)
  document.addEventListener('mousedown', onClick)
  return () => {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('mousedown', onClick)
  }
}, [contextMenu, closeContextMenu])
```

### Mouse move per magnificazione:
```typescript
const handleDockMouseMove = useCallback((e: React.MouseEvent) => {
  setMouseX(e.clientX)
}, [])

const handleDockMouseLeave = useCallback(() => {
  setMouseX(null)
}, [])
```

### Magnificazione per item (calcolo scale):
```typescript
const getItemScale = (itemCenterX: number): number => {
  if (mouseX === null) return 1
  const dist = Math.abs(itemCenterX - mouseX)
  return 1 + 0.3 * Math.max(0, 1 - dist / 100)
}
```

### Drag & drop handlers:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
)

const handleDragStart = useCallback((event: DragStartEvent) => {
  setActiveDragId(String(event.active.id))
}, [])

const handleDragEnd = useCallback((event: DragEndEvent) => {
  setActiveDragId(null)
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIndex = favoriteApps.indexOf(String(active.id))
  const newIndex = favoriteApps.indexOf(String(over.id))
  if (oldIndex === -1 || newIndex === -1) return
  const reordered = arrayMove(favoriteApps, oldIndex, newIndex)
  setFavoriteApps(reordered)
}, [favoriteApps])

const handleDragCancel = useCallback(() => {
  setActiveDragId(null)
}, [])
```

### Render estructura:
Il render attuale viene wrappato in:
```tsx
<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
  <div className="gf-appdock" role="toolbar" aria-label="App dock" ref={dockRef} onMouseMove={handleDockMouseMove} onMouseLeave={handleDockMouseLeave}>
    <SortableContext items={favoriteApps} strategy={horizontalListSortingStrategy}>
      {dockApps.map(item => (
        <DockItem
          key={item.appId}
          item={item}
          isFavorite={item.favorite}
          isOpening={openingApps.has(item.appId)}
          isActiveDrag={activeDragId === item.appId}
          scale={getItemScale(...)}
          onClick={() => handleClick(item.appId)}
          onContextMenu={(e) => handleContextMenu(e, item.appId)}
        />
      ))}
    </SortableContext>
  </div>
  <DragOverlay>...</DragOverlay>
  {contextMenu && <DockContextMenu ... />}
</DndContext>
```

### Component DockItem (useSortable):
```tsx
function DockItem({ item, isFavorite, isOpening, isActiveDrag, scale, onClick, onContextMenu }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.appId,
    disabled: !isFavorite,
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={...}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...(isFavorite ? attributes : {})}
      {...(isFavorite ? listeners : {})}
    >
      ...
    </button>
  )
}
```

### Component DockContextMenu:
```tsx
function DockContextMenu({ appId, x, y, onClose }) {
  const { windows, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, openWindow, isOpen } = useWindowManager()
  const [favoriteApps, setFavoriteApps] = useAppStorage<string[]>('_framework', 'favoriteApps', [])
  const win = windows.find(w => w.appId === appId)
  const isFav = favoriteApps.includes(appId)
  const appOpen = !!win

  return (
    <div className="gf-appdock__context-menu" style={{ left: x, top: y }}>
      {appOpen ? (
        <>
          <button onClick={() => { closeWindow(appId); onClose() }}>Close</button>
          {win.state === 'minimized'
            ? <button onClick={() => { restoreWindow(appId); onClose() }}>Restore</button>
            : <button onClick={() => { minimizeWindow(appId); onClose() }}>Minimize</button>
          }
          {win.state === 'maximized'
            ? <button onClick={() => { restoreWindow(appId); onClose() }}>Restore Window</button>
            : <button onClick={() => { maximizeWindow(appId); onClose() }}>Maximize</button>
          }
        </>
      ) : (
        <button onClick={() => { openWindow(appId); onClose() }}>Open</button>
      )}
      <div className="gf-appdock__context-sep" />
      {isFav
        ? <button onClick={() => { setFavoriteApps(prev => prev.filter(id => id !== appId)); onClose() }}>Remove from Dock</button>
        : <button onClick={() => { setFavoriteApps(prev => [...prev, appId]); onClose() }}>Keep in Dock</button>
      }
    </div>
  )
}
```

---

## 3. AppDock.css — Nuovi stili

### Magnificazione hover (via JS `--gf-scale`):
```css
.gf-appdock__item {
  transform: scale(var(--gf-scale, 1));
  will-change: transform;
}
.gf-appdock__item:hover {
  /* base hover still works */
}
```

### Context menu:
```css
.gf-appdock__context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  padding: var(--gf-space-xs);
  background: var(--gf-bg-app);
  border: 1px solid var(--gf-border);
  border-radius: var(--gf-radius-md);
  box-shadow: var(--gf-shadow-lg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.gf-appdock__context-item {
  display: flex;
  align-items: center;
  gap: var(--gf-space-sm);
  width: 100%;
  padding: var(--gf-space-xs) var(--gf-space-sm);
  border: none;
  background: transparent;
  color: var(--gf-text);
  font-size: var(--gf-size-small);
  border-radius: var(--gf-radius-sm);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.gf-appdock__context-item:hover {
  background: var(--gf-bg-hover);
}
.gf-appdock__context-sep {
  height: 1px;
  margin: var(--gf-space-xs) 0;
  background: var(--gf-border);
}
```

### Dot minimizzato:
```css
.gf-appdock__dot--open {
  background: var(--gf-accent);
}
.gf-appdock__dot--minimized {
  background: transparent;
  border: 1.5px solid var(--gf-accent);
  width: 6px;
  height: 6px;
}
```

### Bounce animation apertura:
```css
@keyframes gf-dock-bounce {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.15); }
  50%  { transform: scale(0.95); }
  75%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.gf-appdock__item--opening .gf-appdock__icon {
  animation: gf-dock-bounce 0.5s ease;
}
```

### Drag feedback:
```css
.gf-appdock__item--dragging {
  opacity: 0.4;
}
.gf-appdock__overlay-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--gf-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: var(--gf-shadow-lg);
}
```
