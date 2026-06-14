import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getStorage } from '@/lib/storage/engine'

interface WidgetOptionsState {
  options: Record<string, Record<string, unknown>>
}

interface WidgetOptionsActions {
  setOption: (widgetId: string, key: string, value: unknown) => void
  getOption: (widgetId: string, key: string) => unknown
}

type WidgetOptionsStore = WidgetOptionsState & WidgetOptionsActions

const storage = getStorage()
const persisted = storage.get<Record<string, Record<string, unknown>>>('widget:options')

export const useWidgetOptionsStore = create<WidgetOptionsStore>()(
  subscribeWithSelector((set, get) => ({
    options: persisted ?? {},

    setOption: (widgetId, key, value) =>
      set((state) => ({
        options: {
          ...state.options,
          [widgetId]: { ...state.options[widgetId], [key]: value },
        },
      })),

    getOption: (widgetId, key) => get().options[widgetId]?.[key],
  })),
)

useWidgetOptionsStore.subscribe((state) => {
  storage.set('widget:options', state.options)
})
