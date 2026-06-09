/* eslint-disable react-refresh/only-export-components */
import { Icon } from '@iconify/react'

const iconDefs: Record<string, string> = {
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  home: 'house',
  menu: 'menu',
  close: 'x',
  search: 'search',
  settings: 'settings',

  play: 'play',
  pause: 'pause',
  stop: 'square',
  volume: 'volume-2',
  heart: 'heart',
  'heart-outline': 'heart',
  'music-note': 'music',

  plus: 'plus',
  check: 'check',
  checkmark: 'check',
  edit: 'pencil',
  trash: 'trash-2',
  refresh: 'refresh-cw',
  'external-link': 'external-link',
  download: 'download',
  upload: 'upload',
  'drag-handle': 'grip-vertical',

  headphones: 'headphones',
  radio: 'radio',
  grid: 'grid-3x3',
  checklist: 'list-checks',
  waveform: 'waveform',
  bird: 'bird',
  rss: 'rss',
  globe: 'globe',
  gamepad: 'gamepad-2',
  document: 'file-text',
  sun: 'sun',
  wave: 'audio-waveform',
  snake: 'bug',
  sparkles: 'sparkles',
  timer: 'clock',
  popup: 'maximize-2',
  gear: 'settings',
  queue: 'list',
  moon: 'moon',
  folder: 'folder',
  calendar: 'calendar',
  tag: 'tag',
  'cloud-off': 'cloud-off',

  droplet: 'droplet',
  wind: 'wind',
  pressure: 'gauge',
  sunrise: 'sunrise',
  temperature: 'thermometer',

  rename: 'pencil-line',
  delete: 'trash-2',
  loading: 'loader-circle',
  shuffle: 'shuffle',
  clear: 'trash-2',
  alert: 'alert-circle',

  'weather-sunny': 'sun',
  'weather-mostly-sunny': 'sun',
  'weather-partly-cloudy': 'cloud-sun',
  'weather-cloudy': 'cloud',
  'weather-fog': 'cloud-fog',
  'weather-drizzle': 'cloud-drizzle',
  'weather-rain': 'cloud-rain',
  'weather-snow': 'cloud-snow',
  'weather-showers': 'cloud-rain',
  'weather-thunderstorm': 'cloud-lightning',

  'moon-new': 'moon',
  'moon-waxing-crescent': 'moon',
  'moon-first-quarter': 'moon',
  'moon-waxing-gibbous': 'moon',
  'moon-full': 'moon',
  'moon-waning-gibbous': 'moon',
  'moon-last-quarter': 'moon',
  'moon-waning-crescent': 'moon',

  music: 'music',
  games: 'gamepad-2',
  productivity: 'clipboard-check',
  utilities: 'wrench',
}

export type IconName = keyof typeof iconDefs

export function getWeatherIcon(code: number): IconName {
  if (code === 0 || code === 1) return 'weather-sunny'
  if (code === 2) return 'weather-partly-cloudy'
  if (code === 3) return 'weather-cloudy'
  if (code >= 45 && code <= 48) return 'weather-fog'
  if (code >= 51 && code <= 55) return 'weather-drizzle'
  if (code >= 61 && code <= 65) return 'weather-rain'
  if (code >= 71 && code <= 75) return 'weather-snow'
  if (code >= 80 && code <= 82) return 'weather-drizzle'
  if (code >= 95) return 'weather-thunderstorm'
  return 'weather-sunny'
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
  const iconName = iconDefs[name]
  const icon = iconName ? `lucide:${iconName}` : `lucide:${name}`

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
