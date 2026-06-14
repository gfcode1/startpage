import { lazy } from 'react'
import type { LazyExoticComponent, ComponentType } from 'react'

export type AppCategory = 'productivity' | 'music' | 'utilities'

export interface AppDefinition {
  id: string
  name: string
  description: string
  path: string
  color: string
  icon: string
  category: AppCategory
  component: LazyExoticComponent<ComponentType>
  widgets?: string[]
}

export const apps: AppDefinition[] = [
  {
    id: 'todo', name: 'Todo', description: 'Task management',
    path: '/todo', color: '#d4763a', icon: 'lucide:check-square',
    category: 'productivity', component: lazy(() => import('@/apps/todo/todo-app')),
    widgets: ['todo'],
  },
  {
    id: 'notes', name: 'Notes', description: 'Markdown notes',
    path: '/notes', color: '#e08a4e', icon: 'lucide:file-text',
    category: 'productivity', component: lazy(() => import('@/apps/notes/notes-app')),
  },
  {
    id: 'kanban', name: 'Kanban', description: 'Project board',
    path: '/kanban', color: '#4a9eff', icon: 'lucide:columns-3',
    category: 'productivity', component: lazy(() => import('@/apps/kanban/kanban-app')),
  },
  {
    id: 'calendar', name: 'Calendar', description: 'Events & schedule',
    path: '/calendar', color: '#5a9e6f', icon: 'lucide:calendar',
    category: 'productivity', component: lazy(() => import('@/apps/calendar/calendar-app')),
    widgets: ['calendar'],
  },
  {
    id: 'pomodoro', name: 'Pomodoro', description: 'Focus timer',
    path: '/pomodoro', color: '#c44b4b', icon: 'lucide:timer',
    category: 'productivity', component: lazy(() => import('@/apps/pomodoro/pomodoro-app')),
  },
  {
    id: 'weather', name: 'Weather', description: 'Forecast & maps',
    path: '/weather', color: '#5ab4d4', icon: 'lucide:cloud-sun',
    category: 'utilities', component: lazy(() => import('@/apps/weather/weather-app')),
    widgets: ['weather'],
  },
  {
    id: 'rssreader', name: 'RSS Reader', description: 'Feed aggregator',
    path: '/rssreader', color: '#d4a43a', icon: 'lucide:rss',
    category: 'utilities', component: lazy(() => import('@/apps/rss-reader/rss-reader-app')),
  },
  {
    id: 'wikipedia', name: 'Wikipedia', description: 'Article browser',
    path: '/wikipedia', color: '#636363', icon: 'lucide:book-open',
    category: 'utilities', component: lazy(() => import('@/apps/wikipedia/wikipedia-app')),
  },
  {
    id: 'somafm', name: 'SomaFM', description: 'Internet radio channels',
    path: '/somafm', color: '#d4763a', icon: 'lucide:music',
    category: 'music', component: lazy(() => import('@/apps/somafm/somafm-app')),
    widgets: ['nowplaying'],
  },
  {
    id: 'moodist', name: 'Moodist', description: '84 ambient sounds — focus, relax, and sleep with layered soundscapes',
    path: '/moodist', color: '#8a5ad4', icon: 'lucide:headphones',
    category: 'music', component: lazy(() => import('@/apps/moodist/moodist-app')),
    widgets: ['nowplaying'],
  },
]

export function getAppByPath(path: string): AppDefinition | undefined {
  return apps.find((a) => a.path === path)
}
