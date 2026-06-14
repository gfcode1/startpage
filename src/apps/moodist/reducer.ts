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

function getRandomArbitrary(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function moodistReducer(state: MoodistState, action: MoodistAction): MoodistState {
  switch (action.type) {
    case 'SELECT': {
      const sound = state.sounds[action.id]
      if (!sound) return state
      return { ...state, sounds: { ...state.sounds, [action.id]: { ...sound, selected: true } } }
    }
    case 'UNSELECT': {
      const sound = state.sounds[action.id]
      if (!sound) return state
      return { ...state, sounds: { ...state.sounds, [action.id]: { ...sound, selected: false } } }
    }
    case 'SET_VOLUME': {
      const sound = state.sounds[action.id]
      if (!sound) return state
      return { ...state, sounds: { ...state.sounds, [action.id]: { ...sound, volume: action.volume } } }
    }
    case 'TOGGLE_FAVORITE': {
      const sound = state.sounds[action.id]
      if (!sound) return state
      return { ...state, sounds: { ...state.sounds, [action.id]: { ...sound, favorite: !sound.favorite } } }
    }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing }
    case 'SHUFFLE': {
      const ids = Object.keys(state.sounds)
      const picked: string[] = []
      const shuffled = [...ids].sort(() => Math.random() - 0.5)
      for (let i = 0; i < Math.min(5, shuffled.length); i++) picked.push(shuffled[i]!)
      const newSounds: SoundsState = {}
      for (const id of ids) {
        if (picked.includes(id)) {
          newSounds[id] = { ...state.sounds[id]!, selected: true, volume: getRandomArbitrary(0.2, 1.0) }
        } else {
          newSounds[id] = { ...state.sounds[id]!, selected: false }
        }
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
      const newSounds: SoundsState = {}
      for (const [id, s] of Object.entries(state.sounds)) {
        newSounds[id] = { ...s, selected: false }
      }
      for (const [id, vol] of Object.entries(action.sounds)) {
        if (newSounds[id]) {
          newSounds[id] = { ...newSounds[id]!, selected: true, volume: vol }
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
