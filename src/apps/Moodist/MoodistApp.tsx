import { useReducer, useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { AppHeader } from '../../framework/components/AppHeader'
import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { useToast } from '../../framework/ToastContext'
import { useTopbar } from '../../framework/TopbarContext'
import { usePlayerActions } from '../../framework/PlayerContext'

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
  const [showPresets, setShowPresets] = useState(false)
  const [showSleepTimer, setShowSleepTimer] = useState(false)
  const { setActions, clearConfig } = useTopbar()
  const { play, setPlayInfo, setPlaying, stop } = usePlayerActions()
  const prevPlayingState = useRef({ isPlaying: false, hasSelection: false })

  const selectedCount = useMemo(() =>
    Object.values(state.sounds).filter(s => s.selected).length,
    [state.sounds],
  )

  useEffect(() => {
    const prev = prevPlayingState.current
    const now = { isPlaying: state.isPlaying, hasSelection: selectedCount > 0 }

    if (now.isPlaying && now.hasSelection && !prev.isPlaying) {
      play({
        id: 'moodist',
        title: 'Ambient Mix',
        subtitle: `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`,
        type: 'moodist',
      })
    } else if (now.isPlaying && now.hasSelection && prev.isPlaying) {
      setPlayInfo('Ambient Mix', `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`)
    } else if (!now.isPlaying && now.hasSelection) {
      setPlaying(false)
    } else if (!now.hasSelection) {
      stop()
    }

    prevPlayingState.current = now
  }, [state.isPlaying, selectedCount, play, setPlayInfo, setPlaying, stop])

  useEffect(() => {
    setActions([
      {
        id: 'presets',
        icon: 'sparkles',
        label: 'Presets',
        onClick: () => setShowPresets(true),
      },
      {
        id: 'sleep-timer',
        icon: 'moon',
        label: 'Sleep Timer',
        onClick: () => setShowSleepTimer(true),
      },
    ])
    return () => { clearConfig() }
  }, [setActions, clearConfig])

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

  const statusMessage = useMemo(() => {
    if (!hasSelection) return 'No sounds selected'
    if (!state.isPlaying) return `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} paused`
    return `Playing ${selectedCount} sound${selectedCount !== 1 ? 's' : ''}`
  }, [hasSelection, state.isPlaying, selectedCount])

  return (
    <div className="gf-moodist">
      <div role="status" aria-live="polite" className="gf-moodist__sr-only">
        {statusMessage}
      </div>

      <AppHeader badge="84 sounds" />

      <PlayerControls
        isPlaying={state.isPlaying}
        hasSelection={hasSelection}
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
          onSelect={handleSelect}
          onUnselect={handleUnselect}
          onSetVolume={handleSetVolume}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}

      <BinauralPanel />
      <NoisePanel />

      <GfBottomSheet open={showPresets} onClose={() => setShowPresets(false)} title="Presets">
        <PresetsPanel
          sounds={state.sounds}
          onApplyPreset={handleApplyPreset}
        />
      </GfBottomSheet>

      <GfBottomSheet open={showSleepTimer} onClose={() => setShowSleepTimer(false)} title="Sleep Timer">
        <SleepTimer onSleep={() => { handleSleep(); setShowSleepTimer(false) }} />
      </GfBottomSheet>
    </div>
  )
}
