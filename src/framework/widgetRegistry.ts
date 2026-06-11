import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { apps } from './appRegistry'

export type WidgetSize = 'small' | 'medium' | 'large'
export type WidgetCategory = 'system' | 'app' | 'standard'

export interface WidgetLayout {
  w: number
  h: number
}

export function getDefaultLayout(size: WidgetSize): WidgetLayout {
  switch (size) {
    case 'small': return { w: 2, h: 1 }
    case 'medium': return { w: 3, h: 1 }
    case 'large': return { w: 6, h: 2 }
  }
}

export interface WidgetOption {
  key: string
  label: string
  type: 'select' | 'toggle' | 'text' | 'number' | 'range' | 'color'
  default: string | boolean | number
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
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
  {
    id: 'highscore',
    name: 'High Scores',
    description: 'Best scores from games',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/HighScoreWidget/HighScoreWidget')),
  },
  {
    id: 'countdown',
    name: 'Countdown',
    description: 'Countdown to an event',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/CountdownWidget/CountdownWidget')),
    options: [
      {
        key: 'label',
        label: 'Event label',
        type: 'text',
        default: '',
      },
      {
        key: 'date',
        label: 'Target date (YYYY-MM-DDTHH:mm)',
        type: 'text',
        default: '',
      },
    ],
  },
  {
    id: 'links',
    name: 'Shortcuts',
    description: 'Quick link shortcuts',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/LinksWidget/LinksWidget')),
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Simple calculator',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/CalcWidget/CalcWidget')),
  },
  {
    id: 'worldclock',
    name: 'World Clock',
    description: 'Time in two cities',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/WorldClockWidget/WorldClockWidget')),
    options: [
      {
        key: 'zone1',
        label: 'First city',
        type: 'select',
        default: 'America/New_York',
        options: [
          { label: 'New York', value: 'America/New_York' },
          { label: 'London', value: 'Europe/London' },
          { label: 'Paris', value: 'Europe/Paris' },
          { label: 'Dubai', value: 'Asia/Dubai' },
          { label: 'Tokyo', value: 'Asia/Tokyo' },
          { label: 'Sydney', value: 'Australia/Sydney' },
          { label: 'Los Angeles', value: 'America/Los_Angeles' },
          { label: 'São Paulo', value: 'America/Sao_Paulo' },
          { label: 'Berlin', value: 'Europe/Berlin' },
          { label: 'Singapore', value: 'Asia/Singapore' },
        ],
      },
      {
        key: 'zone2',
        label: 'Second city',
        type: 'select',
        default: 'Asia/Tokyo',
        options: [
          { label: 'New York', value: 'America/New_York' },
          { label: 'London', value: 'Europe/London' },
          { label: 'Paris', value: 'Europe/Paris' },
          { label: 'Dubai', value: 'Asia/Dubai' },
          { label: 'Tokyo', value: 'Asia/Tokyo' },
          { label: 'Sydney', value: 'Australia/Sydney' },
          { label: 'Los Angeles', value: 'America/Los_Angeles' },
          { label: 'São Paulo', value: 'America/Sao_Paulo' },
          { label: 'Berlin', value: 'Europe/Berlin' },
          { label: 'Singapore', value: 'Asia/Singapore' },
        ],
      },
    ],
  },
  {
    id: 'wordofday',
    name: 'Word of the Day',
    description: 'Word with definition',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/WordOfDayWidget/WordOfDayWidget')),
  },
  {
    id: 'password',
    name: 'Password Generator',
    description: 'Generate secure passwords',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/PasswordWidget/PasswordWidget')),
    options: [
      {
        key: 'length',
        label: 'Length',
        type: 'range',
        default: 16,
        min: 8,
        max: 32,
        step: 1,
      },
      {
        key: 'symbols',
        label: 'Symbols',
        type: 'toggle',
        default: true,
      },
      {
        key: 'numbers',
        label: 'Numbers',
        type: 'toggle',
        default: true,
      },
    ],
  },
  {
    id: 'favapps',
    name: 'Favorite Apps',
    description: 'Quick access to your favorite apps',
    size: 'small',
    category: 'standard',
    component: lazy(() => import('../apps/FavAppsWidget/FavAppsWidget')),
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
  return [...systemWidgets]
}
