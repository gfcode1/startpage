export interface Sound {
  id: string
  label: string
  src: string
}

export interface Category {
  id: string
  title: string
  icon: string
  sounds: Sound[]
}

export type Categories = Category[]

export interface SoundState {
  selected: boolean
  favorite: boolean
  volume: number
}

export type SoundsState = Record<string, SoundState>

export interface Preset {
  id: string
  label: string
  sounds: Record<string, number>
}

export interface SoundscapeState {
  isPlaying: boolean
  sounds: SoundsState
}

export type SoundscapeAction =
  | { type: 'SELECT'; id: string }
  | { type: 'UNSELECT'; id: string }
  | { type: 'SET_VOLUME'; id: string; volume: number }
  | { type: 'TOGGLE_FAVORITE'; id: string }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SHUFFLE' }
  | { type: 'UNSELECT_ALL' }
  | { type: 'OVERRIDE'; sounds: Record<string, number> }
  | { type: 'LOAD'; state: SoundsState }
