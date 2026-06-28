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
    path: '/kanban/:boardId?', color: '#4a9eff', icon: 'lucide:columns-3',
    category: 'productivity', component: lazy(() => import('@/apps/kanban/kanban-app')),
    widgets: ['kanban'],
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
    id: 'news', name: 'News', description: 'World news aggregator',
    path: '/news', color: '#d4a43a', icon: 'lucide:rss',
    category: 'utilities', component: lazy(() => import('@/apps/news/news-app')),
    widgets: ['news'],
  },
  {
    id: 'wikipedia', name: 'Wikipedia', description: 'Article browser',
    path: '/wikipedia', color: '#636363', icon: 'lucide:book-open',
    category: 'utilities', component: lazy(() => import('@/apps/wikipedia/wikipedia-app')),
    widgets: ['wikipedia'],
  },
  {
    id: 'radio', name: 'Radio', description: 'Internet radio channels',
    path: '/radio', color: '#c44b4b', icon: 'lucide:radio',
    category: 'music', component: lazy(() => import('@/apps/radio/radio-app')),
    widgets: ['nowplaying'],
  },
  {
    id: 'soundscape', name: 'Soundscape', description: '84 ambient sounds — focus, relax, and sleep with layered soundscapes',
    path: '/soundscape', color: '#8a5ad4', icon: 'lucide:headphones',
    category: 'music', component: lazy(() => import('@/apps/soundscape/soundscape-app')),
    widgets: ['nowplaying'],
  },
  {
    id: 'password-vault', name: 'Passwords', description: 'Encrypted credential manager',
    path: '/passwords', color: '#22c55e', icon: 'lucide:key-round',
    category: 'utilities', component: lazy(() => import('@/apps/password-vault/password-vault-app')),
    widgets: ['password-vault'],
  },
  {
    id: 'bookmarks', name: 'Bookmarks', description: 'Bookmark manager',
    path: '/bookmarks', color: '#d4a43a', icon: 'lucide:bookmark',
    category: 'productivity', component: lazy(() => import('@/apps/bookmarks/bookmarks-app')),
    widgets: ['bookmarks'],
  },
  {
    id: 'chat', name: 'Chat', description: 'AI chat with OpenRouter',
    path: '/chat', color: '#22c55e', icon: 'lucide:bot',
    category: 'utilities', component: lazy(() => import('@/apps/chat/chat-app')),
    widgets: ['chat'],
  },
]

export function getAppByPath(path: string): AppDefinition | undefined {
  return apps.find((a) => a.path === path)
}
