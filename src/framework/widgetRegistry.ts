import { lazy, ComponentType, LazyExoticComponent } from 'react'

export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetDef {
  id: string
  name: string
  description: string
  size: WidgetSize
  component: LazyExoticComponent<ComponentType>
}

export const widgets: WidgetDef[] = [
  {
    id: 'clock',
    name: 'Clock',
    description: 'Current time and date',
    size: 'small',
    component: lazy(() => import('../apps/ClockWidget/ClockWidget')),
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather conditions',
    size: 'medium',
    component: lazy(() => import('../apps/WeatherWidget/WeatherWidget')),
  },
  {
    id: 'news',
    name: 'News',
    description: 'Latest headlines from your feeds',
    size: 'small',
    component: lazy(() => import('../apps/NewsWidget/NewsWidget')),
  },
  {
    id: 'todo',
    name: 'Todo',
    description: 'Your pending tasks',
    size: 'small',
    component: lazy(() => import('../apps/TodoWidget/TodoWidget')),
  },
  {
    id: 'quicknote',
    name: 'Quick Note',
    description: 'Your latest note',
    size: 'small',
    component: lazy(() => import('../apps/QuickNoteWidget/QuickNoteWidget')),
  },
  {
    id: 'nowplaying',
    name: 'Now Playing',
    description: 'Currently playing track',
    size: 'small',
    component: lazy(() => import('../apps/NowPlayingWidget/NowPlayingWidget')),
  },
  {
    id: 'radiofav',
    name: 'Radio Favorite',
    description: 'Your favorite radio station',
    size: 'small',
    component: lazy(() => import('../apps/RadioFavWidget/RadioFavWidget')),
  },
  {
    id: 'uv',
    name: 'UV Index',
    description: 'Today\'s UV index',
    size: 'small',
    component: lazy(() => import('../apps/UvWidget/UvWidget')),
  },
  {
    id: 'moon',
    name: 'Moon Phase',
    description: 'Current moon phase',
    size: 'small',
    component: lazy(() => import('../apps/MoonWidget/MoonWidget')),
  },
  {
    id: 'aqi',
    name: 'Air Quality',
    description: 'Current air quality index',
    size: 'small',
    component: lazy(() => import('../apps/AqiWidget/AqiWidget')),
  },
  {
    id: 'quote',
    name: 'Quote of Day',
    description: 'Daily inspiration',
    size: 'medium',
    component: lazy(() => import('../apps/QuoteWidget/QuoteWidget')),
  },
]

export function getWidgetById(id: string): WidgetDef | undefined {
  return widgets.find(w => w.id === id)
}
