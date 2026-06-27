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

export const useWidgetOptionsStore = create<WidgetOptionsStore>()(
  subscribeWithSelector((set, get) => ({
    options: {},

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
  getStorage().set('widget:options', state.options)
})

// Rehydration
import { registerRehydrator } from '@/lib/sync/rehydrate'
registerRehydrator((storage) => {
  const options = storage.get<Record<string, Record<string, unknown>>>('widget:options')
  if (options) useWidgetOptionsStore.setState({ options })
})
