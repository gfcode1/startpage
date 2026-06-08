import type { MoodistState, MoodistAction, SoundsState } from './types'
import { categories } from './data/sounds'

function createInitialSounds(): SoundsState {
  const sounds: SoundsState = {}
  for (const cat of categories) {
    for (const s of cat.sounds) {
      sounds[s.id] = { selected: false, favorite: false, volume: 0.5 }
    }
  }
  return sounds
}

export function createInitialState(loaded?: SoundsState): MoodistState {
  return {
    isPlaying: false,
    sounds: loaded ?? createInitialSounds(),
  }
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function moodistReducer(state: MoodistState, action: MoodistAction): MoodistState {
  switch (action.type) {
    case 'SELECT':
      return {
        ...state,
        sounds: {
          ...state.sounds,
          [action.id]: { ...state.sounds[action.id], selected: true },
        },
      }
    case 'UNSELECT':
      return {
        ...state,
        sounds: {
          ...state.sounds,
          [action.id]: { ...state.sounds[action.id], selected: false },
        },
      }
    case 'SET_VOLUME':
      return {
        ...state,
        sounds: {
          ...state.sounds,
          [action.id]: { ...state.sounds[action.id], volume: action.volume },
        },
      }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        sounds: {
          ...state.sounds,
          [action.id]: { ...state.sounds[action.id], favorite: !state.sounds[action.id].favorite },
        },
      }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing }
    case 'SHUFFLE': {
      const ids = Object.keys(state.sounds)
      const picked = pickMany(ids, 5)
      const newSounds: SoundsState = { ...state.sounds }
      for (const id of ids) {
        newSounds[id] = { ...newSounds[id], selected: false }
      }
      for (const id of picked) {
        newSounds[id] = { ...newSounds[id], selected: true, volume: 0.2 + Math.random() * 0.8 }
      }
      return { ...state, sounds: newSounds }
    }
    case 'UNSELECT_ALL': {
      const newSounds: SoundsState = {}
      for (const [id, s] of Object.entries(state.sounds)) {
        newSounds[id] = { ...s, selected: false }
      }
      return { ...state, sounds: newSounds }
    }
    case 'OVERRIDE': {
      const newSounds: SoundsState = { ...state.sounds }
      for (const [id, s] of Object.entries(newSounds)) {
        newSounds[id] = { ...s, selected: false }
      }
      for (const [id, vol] of Object.entries(action.sounds)) {
        if (newSounds[id]) {
          newSounds[id] = { ...newSounds[id], selected: true, volume: vol }
        }
      }
      return { ...state, sounds: newSounds }
    }
    case 'LOAD':
      return { ...state, sounds: action.state }
    default:
      return state
  }
}
