import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { apps } from './appRegistry'

export type WidgetSize = 'small' | 'medium' | 'large'
export type WidgetCategory = 'system' | 'app' | 'standard'

export interface WidgetOption {
  key: string
  label: string
  type: 'select' | 'toggle' | 'text'
  default: string | boolean
  options?: { label: string; value: string }[]
}

export interface WidgetDef {
  id: string
  name: string
  description: string
  size: WidgetSize
  category: WidgetCategory
  component: LazyExoticComponent<ComponentType>
  options?: WidgetOption[]
  defaultActive?: boolean
}

export const systemWidgets: WidgetDef[] = [
  {
    id: 'search',
    name: 'Search & Ask',
    description: 'Search the web or ask an LLM',
    size: 'large',
    category: 'system',
    defaultActive: true,
    component: lazy(() => import('../apps/SearchWidget/SearchWidget')),
    options: [
      {
        key: 'searchEngine',
        label: 'Search Engine',
        type: 'select',
        default: 'google',
        options: [
          { label: 'Google', value: 'google' },
          { label: 'DuckDuckGo', value: 'duckduckgo' },
          { label: 'Bing', value: 'bing' },
          { label: 'Brave Search', value: 'brave' },
          { label: 'Ecosia', value: 'ecosia' },
          { label: 'Startpage', value: 'startpage' },
        ],
      },
      {
        key: 'askProvider',
        label: 'Ask Provider (LLM)',
        type: 'select',
        default: 'perplexity',
        options: [
          { label: 'Perplexity', value: 'perplexity' },
          { label: 'ChatGPT', value: 'chatgpt' },
          { label: 'Gemini', value: 'gemini' },
          { label: 'Claude', value: 'claude' },
          { label: 'Copilot', value: 'copilot' },
        ],
      },
      {
        key: 'openInNewTab',
        label: 'Open in new tab',
        type: 'toggle',
        default: true,
      },
    ],
  },
]

export const widgets: WidgetDef[] = [
  {
    id: 'clock',
    name: 'Clock',
    description: 'Current time and date',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/ClockWidget/ClockWidget')),
  },
  {
    id: 'quicknote',
    name: 'Quick Note',
    description: 'Your latest note',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/QuickNoteWidget/QuickNoteWidget')),
  },
  {
    id: 'quote',
    name: 'Quote of Day',
    description: 'Daily inspiration',
    size: 'medium',
    category: 'standard',
    component: lazy(() => import('../apps/QuoteWidget/QuoteWidget')),
  },
]

export function getAppDefinedWidgets(): WidgetDef[] {
  const seen = new Set<string>()
  return apps.flatMap(a => a.widgets ?? []).filter(w => {
    if (seen.has(w.id)) return false
    seen.add(w.id)
    return true
  })
}

export function getWidgetById(id: string): WidgetDef | undefined {
  const all = [...systemWidgets, ...widgets, ...getAppDefinedWidgets()]
  return all.find(w => w.id === id)
}

export function getAllWidgets(): WidgetDef[] {
  return [...systemWidgets, ...widgets, ...getAppDefinedWidgets()]
}

export function getSystemWidgets(): WidgetDef[] {
  return systemWidgets.filter(w => w.defaultActive)
}
