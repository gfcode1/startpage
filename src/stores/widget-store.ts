import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'
import { widgets, type WidgetSize } from '@/registry/widgets'

export interface WidgetState {
  activeWidgets: string[]
  layout: Record<string, { w: number; h: number }>
}

export interface WidgetActions {
  addWidget: (id: string) => void
  removeWidget: (id: string) => void
  reorderWidgets: (ids: string[]) => void
  setWidgetSize: (id: string, size: WidgetSize) => void
  resetDefaults: () => void
}

type WidgetStore = WidgetState & WidgetActions

const storage = getStorage()
const persisted = storage.get<WidgetState>('widget:config')

function getDefaults(): WidgetState {
  const active = widgets
    .filter((w) => w.defaultActive)
    .map((w) => w.id)
  const layout: Record<string, { w: number; h: number }> = {}
  for (const w of widgets) {
    layout[w.id] = {
      w: w.size === 'large' ? 4 : w.size === 'medium' ? 3 : 2,
      h: w.size === 'large' ? 2 : 1,
    }
  }
  return { activeWidgets: active, layout }
}

export const useWidgetStore = create<WidgetStore>()(
  subscribeWithSelector((set) => ({
    ...(persisted ?? getDefaults()),

    addWidget: (id) =>
      set((state) => ({
        activeWidgets: state.activeWidgets.includes(id)
          ? state.activeWidgets
          : [...state.activeWidgets, id],
      })),

    removeWidget: (id) =>
      set((state) => ({
        activeWidgets: state.activeWidgets.filter((w) => w !== id),
      })),

    reorderWidgets: (ids) => set({ activeWidgets: ids }),

    setWidgetSize: (id, size) =>
      set((state) => ({
        layout: {
          ...state.layout,
          [id]: { w: size === 'large' ? 4 : size === 'medium' ? 3 : 2, h: size === 'large' ? 2 : 1 },
        },
      })),

    resetDefaults: () => set(getDefaults()),
  })),
)

// Persist on change
useWidgetStore.subscribe((state) => {
  storage.set('widget:config', { activeWidgets: state.activeWidgets, layout: state.layout })
})

// Atomic selectors individuali
export const useWidgetActiveWidgets = () => useWidgetStore((s) => s.activeWidgets)
export const useWidgetLayout = () => useWidgetStore((s) => s.layout)

// Action hooks individuali
export const useWidgetAddWidget = () => useWidgetStore((s) => s.addWidget)
export const useWidgetRemoveWidget = () => useWidgetStore((s) => s.removeWidget)
export const useWidgetReorderWidgets = () => useWidgetStore((s) => s.reorderWidgets)
export const useWidgetSetWidgetSize = () => useWidgetStore((s) => s.setWidgetSize)
export const useWidgetResetDefaults = () => useWidgetStore((s) => s.resetDefaults)
