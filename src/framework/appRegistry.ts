import { lazy, ComponentType, LazyExoticComponent } from 'react'

export type AppCategory = 'music' | 'games' | 'productivity' | 'utilities'

export interface AppDef {
  id: string
  name: string
  description: string
  path: string
  color: string
  gradient: string
  icon: string
  category: AppCategory
  component: LazyExoticComponent<ComponentType>
}

export const apps: AppDef[] = [
  {
    id: 'youtubestreams',
    name: 'YouTube Streams',
    description: 'Play any YouTube stream — add custom streams, search & save favorites',
    path: '/youtubestreams',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #ef4444)',
    icon: 'tabler:headphones',
    category: 'music',
    component: lazy(() => import('../apps/YouTubeStreams/YouTubeStreamsApp')),
  },
  {
    id: 'somafm',
    name: 'SomaFM Radio',
    description: '46 curated internet radio channels — ambient, electronic, lounge & more',
    path: '/somafm',
    color: '#d4763a',
    gradient: 'linear-gradient(135deg, #d4763a, #f0a757)',
    icon: 'tabler:antenna-bars-5',
    category: 'music',
    component: lazy(() => import('../apps/Somafm/SomafmApp')),
  },
  {
    id: 'game2048',
    name: '2048',
    description: 'Merge tiles to reach 2048',
    path: '/game2048',
    color: '#d4763a',
    gradient: 'linear-gradient(135deg, #d4763a, #6b2fa0)',
    icon: 'tabler:layout-grid',
    category: 'games',
    component: lazy(() => import('../apps/Game2048/Game2048App')),
  },
  {
    id: 'todo',
    name: 'Todo List',
    description: 'Simple task manager — add, complete, prioritize, and filter tasks',
    path: '/todo',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #06b6d4)',
    icon: 'tabler:list-check',
    category: 'productivity',
    component: lazy(() => import('../apps/Todo/TodoApp')),
  },
  {
    id: 'flappybird',
    name: 'Flappy Bird',
    description: 'Tap to fly! Dodge pipes and set your high score',
    path: '/flappybird',
    color: '#4dc9f6',
    gradient: 'linear-gradient(135deg, #4dc9f6, #73bf2e)',
    icon: 'lucide:bird',
    category: 'games',
    component: lazy(() => import('../apps/FlappyBird/FlappyBirdApp')),
  },
  {
    id: 'rssreader',
    name: 'RSS Reader',
    description: 'Aggregate and browse articles from multiple RSS feeds',
    path: '/rssreader',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #eab308)',
    icon: 'tabler:rss',
    category: 'utilities',
    component: lazy(() => import('../apps/RssReader/RssReaderApp')),
  },
  {
    id: 'radiobrowser',
    name: 'Radio Browser',
    description: 'Browse & play thousands of radio stations from around the world',
    path: '/radiobrowser',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #06b6d4)',
    icon: 'tabler:globe',
    category: 'music',
    component: lazy(() => import('../apps/RadioBrowser/RadioBrowserApp')),
  },
  {
    id: 'emulator',
    name: 'EmulatorJS',
    description: 'Play retro games — NES, SNES, GameBoy, N64, Sega, Atari, and more',
    path: '/emulator',
    color: '#9b59b6',
    gradient: 'linear-gradient(135deg, #9b59b6, #e74c3c)',
    icon: 'tabler:device-gamepad-2',
    category: 'games',
    component: lazy(() => import('../apps/EmulatorLauncher/EmulatorLauncherApp')),
  },
  {
    id: 'markdownnotes',
    name: 'Markdown Notes',
    description: 'Write and organize notes in Markdown with live preview',
    path: '/markdownnotes',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #eab308, #f97316)',
    icon: 'tabler:file-text',
    category: 'productivity',
    component: lazy(() => import('../apps/MarkdownNotes/MarkdownNotesApp')),
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather & 7-day forecast — search cities, check conditions',
    path: '/weather',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    icon: 'tabler:sun',
    category: 'utilities',
    component: lazy(() => import('../apps/Weather/WeatherApp')),
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake — eat, grow, and avoid crashing into walls or yourself',
    path: '/snake',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    icon: 'tabler:bug',
    category: 'games',
    component: lazy(() => import('../apps/Snake/SnakeApp')),
  },
  {
    id: 'moodist',
    name: 'Moodist',
    description: '84 ambient sounds — focus, relax, and sleep with layered soundscapes',
    path: '/moodist',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
    icon: 'tabler:wave-sine',
    category: 'music',
    component: lazy(() => import('../apps/Moodist/MoodistApp')),
  },
]

export function getAppById(id: string): AppDef | undefined {
  return apps.find(a => a.id === id)
}

export function getAppByPath(path: string): AppDef | undefined {
  return apps.find(a => a.path === path)
}
