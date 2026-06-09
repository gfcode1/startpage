/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react'
import { useAppStorage } from './persistence/useAppStorage'
import { getWidgetById } from './widgetRegistry'

interface WidgetOptionsContextValue {
  getOptions: (widgetId: string) => Record<string, unknown>
  setOption: (widgetId: string, key: string, value: unknown) => void
}

const WidgetOptionsContext = createContext<WidgetOptionsContextValue | null>(null)

export function WidgetOptionsProvider({ children }: { children: ReactNode }) {
  const [allOptions, setAllOptions] = useAppStorage<Record<string, Record<string, unknown>>>(
    '_framework',
    'widgetOptions',
    {},
  )

  const getOptions = useCallback((widgetId: string): Record<string, unknown> => {
    const def = getWidgetById(widgetId)
    if (!def?.options) return {}
    const stored = allOptions[widgetId] ?? {}
    const merged: Record<string, unknown> = {}
    for (const opt of def.options) {
      merged[opt.key] = stored[opt.key] !== undefined ? stored[opt.key] : opt.default
    }
    return merged
  }, [allOptions])

  const setOption = useCallback((widgetId: string, key: string, value: unknown) => {
    setAllOptions(prev => ({
      ...prev,
      [widgetId]: {
        ...(prev[widgetId] ?? {}),
        [key]: value,
      },
    }))
  }, [setAllOptions])

  const value = useMemo(() => ({ getOptions, setOption }), [getOptions, setOption])

  return (
    <WidgetOptionsContext.Provider value={value}>
      {children}
    </WidgetOptionsContext.Provider>
  )
}

export function useWidgetOptions(widgetId: string): { options: Record<string, unknown>; setOption: (key: string, value: unknown) => void } {
  const ctx = useContext(WidgetOptionsContext)
  if (!ctx) throw new Error('useWidgetOptions must be used within WidgetOptionsProvider')
  const options = ctx.getOptions(widgetId)
  const setOption = useCallback((key: string, value: unknown) => {
    ctx.setOption(widgetId, key, value)
  }, [ctx, widgetId])
  return useMemo(() => ({ options, setOption }), [options, setOption])
}
