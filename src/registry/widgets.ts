import { lazy } from 'react'
import type { LazyExoticComponent, ComponentType } from 'react'

export type WidgetCategory = 'system' | 'standard' | 'app'
export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetOption {
  key: string
  label: string
  type: 'select' | 'toggle' | 'text' | 'number' | 'range' | 'color'
  defaultValue: unknown
  options?: { label: string; value: string }[]
  min?: number
  max?: number
}

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: WidgetCategory
  defaultActive: boolean
  size: WidgetSize
  align?: 'center' | 'left'
  component: LazyExoticComponent<ComponentType>
  options?: WidgetOption[]
}

export const widgets: WidgetDefinition[] = [
  {
    id: 'search', name: 'Search', description: 'Search the web',
    icon: 'lucide:search', category: 'system', defaultActive: true,
    size: 'large', component: lazy(() => import('@/widgets/search-widget/search-widget')),
  },
  {
    id: 'clock', name: 'Clock', description: 'Current time',
    icon: 'lucide:clock', category: 'standard', defaultActive: true,
    size: 'small', align: 'center', component: lazy(() => import('@/widgets/clock-widget/clock-widget')),
  },
  {
    id: 'quicknote', name: 'Quick Note', description: 'Quick sticky note',
    icon: 'lucide:sticky-note', category: 'standard', defaultActive: true,
    size: 'small', component: lazy(() => import('@/widgets/quick-note-widget/quick-note-widget')),
  },
  {
    id: 'quote', name: 'Quote', description: 'Daily inspiration',
    icon: 'lucide:quote', category: 'standard', defaultActive: false,
    size: 'small', align: 'center', component: lazy(() => import('@/widgets/quote-widget/quote-widget')),
  },
  {
    id: 'countdown', name: 'Countdown', description: 'Countdown timer',
    icon: 'lucide:clock-countdown', category: 'standard', defaultActive: false,
    size: 'small', component: lazy(() => import('@/widgets/countdown-widget/countdown-widget')),
  },
  {
    id: 'todo', name: 'Todo', description: 'Pending tasks',
    icon: 'lucide:check-square', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/todo/widgets/todo-widget')),
  },
  {
    id: 'weather', name: 'Weather', description: 'Current weather',
    icon: 'lucide:cloud-sun', category: 'app', defaultActive: false,
    size: 'medium', align: 'center', component: lazy(() => import('@/apps/weather/widgets/weather-widget')),
  },
  {
    id: 'calendar', name: 'Calendar', description: 'Upcoming events',
    icon: 'lucide:calendar', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/calendar/widgets/calendar-widget')),
    options: [
      { key: 'daysToShow', label: 'Days ahead', type: 'number', defaultValue: 7, min: 1, max: 30 },
    ],
  },
  {
    id: 'nowplaying', name: 'Now Playing', description: 'Current track',
    icon: 'lucide:music', category: 'app', defaultActive: false,
    size: 'small', align: 'center', component: lazy(() => import('@/widgets/now-playing-widget/now-playing-widget')),
  },
  {
    id: 'password-vault', name: 'Passwords', description: 'Recent passwords',
    icon: 'lucide:key-round', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/password-vault/widgets/password-vault-widget')),
  },
  {
    id: 'calculator', name: 'Calculator', description: 'Quick calculator',
    icon: 'lucide:calculator', category: 'standard', defaultActive: false,
    size: 'small', component: lazy(() => import('@/widgets/calculator-widget/calculator-widget')),
  },
  {
    id: 'worldclock', name: 'World Clock', description: 'Two-city time',
    icon: 'lucide:globe', category: 'standard', defaultActive: false,
    size: 'small', component: lazy(() => import('@/widgets/world-clock-widget/world-clock-widget')),
  },
  {
    id: 'kanban', name: 'Kanban', description: 'Board summary',
    icon: 'lucide:columns-3', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/kanban/widgets/kanban-widget')),
  },
  {
    id: 'news', name: 'News', description: 'Latest headlines',
    icon: 'lucide:rss', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/news/widgets/news-widget')),
  },
  {
    id: 'wikipedia', name: 'Wikipedia', description: 'Article browser widget',
    icon: 'lucide:book-open', category: 'app', defaultActive: false,
    size: 'small', align: 'center', component: lazy(() => import('@/apps/wikipedia/widgets/wikipedia-widget')),
  },
  {
    id: 'bookmarks', name: 'Bookmarks', description: 'Recent bookmarks',
    icon: 'lucide:bookmark', category: 'app', defaultActive: false,
    size: 'medium', component: lazy(() => import('@/apps/bookmarks/widgets/bookmarks-widget')),
  },
]
