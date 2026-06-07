import { useReducer, useMemo, useCallback, useEffect } from 'react'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { useToast } from '../../framework/ToastContext'

import { categories, getAllSounds } from './data/sounds'
import { moodistReducer, createInitialState } from './reducer'
import type { SoundsState } from './types'
import { CategorySection } from './components/CategorySection'
import { PlayerControls } from './components/PlayerControls'
import { PresetsPanel } from './components/PresetsPanel'
import { SleepTimer } from './components/SleepTimer'
import { BinauralPanel } from './components/BinauralPanel'
import { NoisePanel } from './components/NoisePanel'
import './MoodistApp.css'

const APP_ID = 'moodist'
const STORAGE_KEY = 'state'

export default function MoodistApp() {
  const { addToast } = useToast()
  const [persisted, setPersisted] = useAppStorage<SoundsState | undefined>(APP_ID, STORAGE_KEY, undefined)
  const [state, dispatch] = useReducer(moodistReducer, persisted, createInitialState)

  useEffect(() => {
    setPersisted(state.sounds)
  }, [state.sounds, setPersisted])

  const hasSelection = useMemo(() =>
    Object.values(state.sounds).some(s => s.selected),
    [state.sounds],
  )

  const hasNoSelection = useMemo(() =>
    Object.values(state.sounds).every(s => !s.selected),
    [state.sounds],
  )

  const handleTogglePlay = useCallback(() => {
    if (hasNoSelection) {
      addToast('Please first select a sound to play.')
      return
    }
    dispatch({ type: 'SET_PLAYING', playing: !state.isPlaying })
  }, [state.isPlaying, hasNoSelection, addToast])

  const handleSelect = useCallback((id: string) => {
    dispatch({ type: 'SELECT', id })
  }, [])

  const handleUnselect = useCallback((id: string) => {
    dispatch({ type: 'UNSELECT', id })
  }, [])

  const handleSetVolume = useCallback((id: string, volume: number) => {
    dispatch({ type: 'SET_VOLUME', id, volume })
  }, [])

  const handleToggleFavorite = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', id })
  }, [])

  const handleShuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' })
    addToast('Shuffled 5 random sounds')
  }, [addToast])

  const handleUnselectAll = useCallback(() => {
    dispatch({ type: 'UNSELECT_ALL' })
  }, [])

  const handleApplyPreset = useCallback((presetSounds: Record<string, number>) => {
    dispatch({ type: 'OVERRIDE', sounds: presetSounds })
    dispatch({ type: 'SET_PLAYING', playing: true })
    addToast('Preset applied')
  }, [addToast])

  const handleSleep = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', playing: false })
    addToast('Sleep timer finished')
  }, [addToast])

  const favoriteIds = useMemo(() =>
    Object.entries(state.sounds).filter(([, s]) => s.favorite).map(([id]) => id),
    [state.sounds],
  )

  const allSounds = useMemo(() => getAllSounds(), [])

  const favoriteSounds = useMemo(() => {
    return favoriteIds
      .map(id => allSounds.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s != null)
  }, [favoriteIds, allSounds])

  const allCategories = useMemo(() => {
    if (favoriteSounds.length === 0) return categories
    return [
      {
        id: 'favorites',
        title: 'Favorites',
        icon: 'heart',
        sounds: favoriteSounds,
      },
      ...categories,
    ]
  }, [favoriteSounds])

  useEffect(() => {
    if (state.isPlaying && hasNoSelection) {
      dispatch({ type: 'SET_PLAYING', playing: false })
    }
  }, [state.isPlaying, hasNoSelection])

  return (
    <div className="gf-moodist">
      <AppHeader
        title="Moodist"
        badge="84 sounds"
      />

      <PlayerControls
        isPlaying={state.isPlaying}
        hasSelection={hasSelection}
        locked={false}
        onTogglePlay={handleTogglePlay}
        onShuffle={handleShuffle}
        onUnselectAll={handleUnselectAll}
      />

      {allCategories.map(cat => (
        <CategorySection
          key={cat.id}
          category={cat}
          soundsState={state.sounds}
          isGloballyPlaying={state.isPlaying}
          isLocked={false}
          onSelect={handleSelect}
          onUnselect={handleUnselect}
          onSetVolume={handleSetVolume}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}

      <PresetsPanel
        sounds={state.sounds}
        onApplyPreset={handleApplyPreset}
      />

      <SleepTimer onSleep={handleSleep} />

      <BinauralPanel />

      <NoisePanel />
    </div>
  )
}
