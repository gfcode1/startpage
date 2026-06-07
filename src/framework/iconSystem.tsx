/* eslint-disable react-refresh/only-export-components */
import { useContext } from 'react'
import { Icon } from '@iconify/react'
import { GfThemeContext } from './ThemeProvider'

const themePrefix: Record<string, string> = {
  analog: 'tabler',
  spectrum: 'lucide',
  daylight: 'solar',
  retro: 'ph',
  forest: 'mdi',
}

interface IconOverride {
  tabler?: string
  lucide?: string
  solar?: string
  ph?: string
  mdi?: string
}

const iconDefs: Record<string, IconOverride> = {
  // Navigation
  'chevron-left': { tabler: 'chevron-left', lucide: 'chevron-left', solar: 'alt-arrow-left-line-duotone', ph: 'caret-left', mdi: 'chevron-left' },
  'chevron-right': { tabler: 'chevron-right', lucide: 'chevron-right', solar: 'alt-arrow-right-line-duotone', ph: 'caret-right', mdi: 'chevron-right' },
  'chevron-down': { tabler: 'chevron-down', lucide: 'chevron-down', solar: 'alt-arrow-down-line-duotone', ph: 'caret-down', mdi: 'chevron-down' },
  home: { tabler: 'home', lucide: 'house', solar: 'home-angle-line-duotone', ph: 'house', mdi: 'home' },
  menu: { tabler: 'menu-2', lucide: 'menu', solar: 'menu-dots-line-duotone', ph: 'list', mdi: 'menu' },
  close: { tabler: 'x', lucide: 'x', solar: 'close-circle-line-duotone', ph: 'x', mdi: 'close' },
  search: { tabler: 'search', lucide: 'search', solar: 'magnifer-line-duotone', ph: 'magnifying-glass', mdi: 'magnify' },
  settings: { tabler: 'settings', lucide: 'settings', solar: 'settings-line-duotone', ph: 'gear', mdi: 'cog' },

  // Media
  play: { tabler: 'player-play', lucide: 'play', solar: 'play-line-duotone', ph: 'play', mdi: 'play' },
  pause: { tabler: 'player-pause', lucide: 'pause', solar: 'pause-line-duotone', ph: 'pause', mdi: 'pause' },
  stop: { tabler: 'player-stop', lucide: 'square', solar: 'stop-line-duotone', ph: 'stop', mdi: 'stop' },
  volume: { tabler: 'volume', lucide: 'volume-2', solar: 'volume-loud-line-duotone', ph: 'speaker-high', mdi: 'volume-high' },
  heart: { tabler: 'heart', lucide: 'heart', solar: 'heart-angle-line-duotone', ph: 'heart', mdi: 'heart' },
  'heart-outline': { tabler: 'heart', lucide: 'heart', solar: 'heart-line-duotone', ph: 'heart', mdi: 'heart-outline' },
  'music-note': { tabler: 'music', lucide: 'music', solar: 'music-notes-line-duotone', ph: 'music-note', mdi: 'music' },

  // Actions
  plus: { tabler: 'plus', lucide: 'plus', solar: 'add-circle-line-duotone', ph: 'plus', mdi: 'plus' },
  check: { tabler: 'check', lucide: 'check', solar: 'check-circle-line-duotone', ph: 'check', mdi: 'check' },
  edit: { tabler: 'edit', lucide: 'pencil', solar: 'pen-new-round-line-duotone', ph: 'pencil', mdi: 'pencil' },
  trash: { tabler: 'trash', lucide: 'trash-2', solar: 'trash-bin-trash-line-duotone', ph: 'trash', mdi: 'delete' },
  refresh: { tabler: 'refresh', lucide: 'refresh-cw', solar: 'refresh-circle-line-duotone', ph: 'arrows-clockwise', mdi: 'refresh' },
  'external-link': { tabler: 'external-link', lucide: 'external-link', solar: 'external-link-line-duotone', ph: 'arrow-square-out', mdi: 'open-in-new' },
  download: { tabler: 'download', lucide: 'download', solar: 'download-line-duotone', ph: 'download', mdi: 'download' },
  upload: { tabler: 'upload', lucide: 'upload', solar: 'upload-line-duotone', ph: 'upload', mdi: 'upload' },
  'drag-handle': { tabler: 'grip-vertical', lucide: 'grip-vertical', solar: 'menu-dots-line-duotone', ph: 'dots-six-vertical', mdi: 'drag' },

  // Launcher app icons
  headphones: { tabler: 'headphones', lucide: 'headphones', solar: 'headphones-line-duotone', ph: 'headphones', mdi: 'headphones' },
  radio: { tabler: 'antenna-bars-5', lucide: 'radio', solar: 'radio-line-duotone', ph: 'radio', mdi: 'radio' },
  grid: { tabler: 'layout-grid', lucide: 'grid-3x3', solar: 'widget-6-line-duotone', ph: 'grid-four', mdi: 'grid' },
  checklist: { tabler: 'list-check', lucide: 'list-checks', solar: 'checklist-line-duotone', ph: 'check-square', mdi: 'checklist' },
  waveform: { tabler: 'wave-saw-tool', lucide: 'waveform', solar: 'wave-sine-line-duotone', ph: 'wave-sine', mdi: 'waveform' },
  bird: { tabler: 'bird', lucide: 'bird', solar: 'bird-line-duotone', ph: 'bird', mdi: 'bird' },
  rss: { tabler: 'rss', lucide: 'rss', solar: 'rss-line-duotone', ph: 'rss', mdi: 'rss' },
  globe: { tabler: 'globe', lucide: 'globe', solar: 'globus-line-duotone', ph: 'globe', mdi: 'globe' },
  gamepad: { tabler: 'device-gamepad-2', lucide: 'gamepad-2', solar: 'gamepad-line-duotone', ph: 'game-controller', mdi: 'gamepad-variant' },
  document: { tabler: 'file-text', lucide: 'file-text', solar: 'document-text-line-duotone', ph: 'file-text', mdi: 'file-document' },
  sun: { tabler: 'sun', lucide: 'sun', solar: 'sun-line-duotone', ph: 'sun', mdi: 'weather-sunny' },
  wave: { tabler: 'wave-sine', lucide: 'wave', solar: 'wave-sine-line-duotone', ph: 'wave-sine', mdi: 'wave' },
  snake: { tabler: 'bug', lucide: 'snake', solar: 'bug-line-duotone', ph: 'snake', mdi: 'snake' },
  sparkles: { tabler: 'sparkles', lucide: 'sparkles', solar: 'stars-line-duotone', ph: 'sparkle', mdi: 'auto-fix' },
  popup: { tabler: 'arrows-maximize', lucide: 'maximize-2', solar: 'maximize-line-duotone', ph: 'arrows-out', mdi: 'fullscreen' },
  gear: { tabler: 'settings', lucide: 'settings', solar: 'settings-line-duotone', ph: 'gear', mdi: 'cog' },

  // Weather details
  droplet: { tabler: 'droplet', lucide: 'droplet', solar: 'waterdrops-line-duotone', ph: 'drop', mdi: 'water-percent' },
  wind: { tabler: 'wind', lucide: 'wind', solar: 'wind-line-duotone', ph: 'wind', mdi: 'weather-windy' },
  pressure: { tabler: 'gauge', lucide: 'gauge', solar: 'tuning-4-line-duotone', ph: 'speedometer', mdi: 'gauge' },
  sunrise: { tabler: 'sunrise', lucide: 'sunrise', solar: 'sunrise-line-duotone', ph: 'sunrise', mdi: 'weather-sunset' },
  temperature: { tabler: 'temperature', lucide: 'thermometer', solar: 'thermometer-line-duotone', ph: 'thermometer', mdi: 'thermometer' },

  // Weather conditions (data icons)
  'weather-sunny': { tabler: 'sun', lucide: 'sun', solar: 'sun-line-duotone', ph: 'sun', mdi: 'weather-sunny' },
  'weather-mostly-sunny': { tabler: 'sun-high', lucide: 'sun', solar: 'sun-fog-line-duotone', ph: 'sun', mdi: 'weather-sunny' },
  'weather-partly-cloudy': { tabler: 'cloud-sun', lucide: 'cloud-sun', solar: 'cloud-sun-line-duotone', ph: 'cloud-sun', mdi: 'weather-partly-cloudy' },
  'weather-cloudy': { tabler: 'cloud', lucide: 'cloud', solar: 'cloud-line-duotone', ph: 'cloud', mdi: 'weather-cloudy' },
  'weather-fog': { tabler: 'mist', lucide: 'cloud-fog', solar: 'fog-line-duotone', ph: 'cloud-fog', mdi: 'weather-fog' },
  'weather-drizzle': { tabler: 'cloud-rain', lucide: 'cloud-drizzle', solar: 'cloud-rain-line-duotone', ph: 'cloud-rain', mdi: 'weather-rainy' },
  'weather-rain': { tabler: 'cloud-rain', lucide: 'cloud-rain', solar: 'cloud-rain-line-duotone', ph: 'cloud-rain', mdi: 'weather-pouring' },
  'weather-snow': { tabler: 'snowflake', lucide: 'cloud-snow', solar: 'snowflake-line-duotone', ph: 'snowflake', mdi: 'weather-snowy' },
  'weather-showers': { tabler: 'cloud-rain', lucide: 'cloud-rain', solar: 'cloud-rain-line-duotone', ph: 'cloud-rain', mdi: 'weather-rainy' },
  'weather-thunderstorm': { tabler: 'cloud-storm', lucide: 'cloud-lightning', solar: 'storm-line-duotone', ph: 'cloud-lightning', mdi: 'weather-lightning' },

  // Moon phases
  'moon-new': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-new' },
  'moon-waxing-crescent': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-waxing-crescent' },
  'moon-first-quarter': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-first-quarter' },
  'moon-waxing-gibbous': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-waxing-gibbous' },
  'moon-full': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-full' },
  'moon-waning-gibbous': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-waning-gibbous' },
  'moon-last-quarter': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-last-quarter' },
  'moon-waning-crescent': { tabler: 'moon', lucide: 'moon', solar: 'moon-line-duotone', ph: 'moon', mdi: 'moon-waning-crescent' },

  // Categories
  music: { tabler: 'music', lucide: 'music', solar: 'music-notes-line-duotone', ph: 'music-note', mdi: 'music' },
  games: { tabler: 'device-gamepad-2', lucide: 'gamepad-2', solar: 'gamepad-line-duotone', ph: 'game-controller', mdi: 'gamepad-variant' },
  productivity: { tabler: 'clipboard-check', lucide: 'clipboard-check', solar: 'clipboard-check-line-duotone', ph: 'clipboard-check', mdi: 'clipboard-check' },
  utilities: { tabler: 'tools', lucide: 'wrench', solar: 'widget-2-line-duotone', ph: 'wrench', mdi: 'tools' },

  // Moodist
  rename: { tabler: 'edit', lucide: 'pencil-line', solar: 'pen-new-round-line-duotone', ph: 'pencil-line', mdi: 'pencil' },
  delete: { tabler: 'trash', lucide: 'trash-2', solar: 'trash-bin-trash-line-duotone', ph: 'trash', mdi: 'delete' },
  loading: { tabler: 'loader-2', lucide: 'loader-circle', solar: 'spinner-line-duotone', ph: 'spinner', mdi: 'loading' },
  shuffle: { tabler: 'arrows-shuffle', lucide: 'shuffle', solar: 'shuffle-line-duotone', ph: 'shuffle', mdi: 'shuffle' },
  clear: { tabler: 'trash', lucide: 'trash-2', solar: 'trash-bin-trash-line-duotone', ph: 'trash', mdi: 'delete' },

  // Weather code mapped icons (simplified)
  'weather-code-sunny': { tabler: 'sun', lucide: 'sun', solar: 'sun-line-duotone', ph: 'sun', mdi: 'weather-sunny' },
  'weather-code-cloudy': { tabler: 'cloud', lucide: 'cloud', solar: 'cloud-line-duotone', ph: 'cloud', mdi: 'weather-cloudy' },
  'weather-code-overcast': { tabler: 'cloud', lucide: 'cloud', solar: 'clouds-line-duotone', ph: 'cloud', mdi: 'weather-cloudy' },
  'weather-code-fog': { tabler: 'mist', lucide: 'cloud-fog', solar: 'fog-line-duotone', ph: 'cloud-fog', mdi: 'weather-fog' },
  'weather-code-rain': { tabler: 'cloud-rain', lucide: 'cloud-rain', solar: 'cloud-rain-line-duotone', ph: 'cloud-rain', mdi: 'weather-pouring' },
  'weather-code-snow': { tabler: 'snowflake', lucide: 'cloud-snow', solar: 'snowflake-line-duotone', ph: 'snowflake', mdi: 'weather-snowy' },
  'weather-code-thunderstorm': { tabler: 'cloud-storm', lucide: 'cloud-lightning', solar: 'storm-line-duotone', ph: 'cloud-lightning', mdi: 'weather-lightning' },
  'weather-code-drizzle': { tabler: 'cloud-rain', lucide: 'cloud-drizzle', solar: 'cloud-rain-line-duotone', ph: 'cloud-rain', mdi: 'weather-rainy' },
}

const defaultPrefix: Record<string, string> = {
  tabler: 'tabler',
  lucide: 'lucide',
  solar: 'solar',
  ph: 'ph',
  mdi: 'mdi',
}

export type IconName = keyof typeof iconDefs

function resolveIcon(name: string, prefix: string): string {
  const def = (iconDefs as Record<string, IconOverride | undefined>)[name]
  if (!def) return `${prefix}:${name}`
  const iconName = def[prefix as keyof IconOverride]
  if (!iconName) return `${prefix}:${name}`
  const pfx = defaultPrefix[prefix] || prefix
  return `${pfx}:${iconName}`
}

export function getWeatherIcon(code: number): IconName {
  if (code === 0 || code === 1) return 'weather-code-sunny'
  if (code === 2) return 'weather-partly-cloudy'
  if (code === 3) return 'weather-code-overcast'
  if (code >= 45 && code <= 48) return 'weather-code-fog'
  if (code >= 51 && code <= 55) return 'weather-code-drizzle'
  if (code >= 61 && code <= 65) return 'weather-code-rain'
  if (code >= 71 && code <= 75) return 'weather-code-snow'
  if (code >= 80 && code <= 82) return 'weather-code-drizzle'
  if (code >= 95) return 'weather-code-thunderstorm'
  return 'weather-code-sunny'
}

export function getMoonPhaseIcon(phaseIndex: number): IconName {
  const phases: IconName[] = [
    'moon-new',
    'moon-waxing-crescent',
    'moon-first-quarter',
    'moon-waxing-gibbous',
    'moon-full',
    'moon-waning-gibbous',
    'moon-last-quarter',
    'moon-waning-crescent',
  ]
  return phases[phaseIndex] ?? 'moon-full'
}

interface GfIconProps {
  name: IconName
  size?: number
  className?: string
}

export function GfIcon({ name, size = 16, className }: GfIconProps) {
  const ctx = useContext(GfThemeContext)
  const themeKey = ctx?.themeKey || 'analog'
  const prefix = themePrefix[themeKey] || 'tabler'
  const icon = resolveIcon(name, prefix)

  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    />
  )
}
