import { useReducer, useMemo, useCallback, useEffect, useRef } from 'react'
import { Container, Text, Group, Drawer, Badge } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useHotkeys } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { getStorage } from '@/lib/storage/engine'
import { usePlayerPlay, usePlayerSetPlaying, usePlayerStop, usePlayerSetPlayInfo } from '@/stores/player-store'
import { categories, getAllSounds } from './data/sounds'
import { moodistReducer, createInitialState } from './reducer'
import type { SoundsState } from './types'
import { CategorySection } from './components/CategorySection'
import { PlayerControls } from './components/PlayerControls'
import { PresetsPanel } from './components/PresetsPanel'
import { SleepTimer } from './components/SleepTimer'
import { BinauralPanel } from './components/BinauralPanel'
import { NoisePanel } from './components/NoisePanel'

const STORAGE_KEY = 'moodist:state'

export default function MoodistApp() {
  const [state, dispatch] = useReducer(moodistReducer, getStorage().get<SoundsState>(STORAGE_KEY) ?? undefined, createInitialState)
  const [presetsOpen, { open: openPresets, close: closePresets }] = useDisclosure(false)
  const [sleepOpen, { open: openSleep, close: closeSleep }] = useDisclosure(false)
  const play = usePlayerPlay()
  const setPlayInfo = usePlayerSetPlayInfo()
  const setPlaying = usePlayerSetPlaying()
  const stopPlayer = usePlayerStop()
  const prevPlayingState = useRef({ isPlaying: false, hasSelection: false })

  const selectedCount = useMemo(() =>
    Object.values(state.sounds).filter((s) => s.selected).length,
    [state.sounds],
  )

  // Persist state
  useEffect(() => { getStorage().set(STORAGE_KEY, state.sounds) }, [state.sounds])

  // Sync with PlayerStore
  useEffect(() => {
    const prev = prevPlayingState.current
    const now = { isPlaying: state.isPlaying, hasSelection: selectedCount > 0 }
    if (now.isPlaying && now.hasSelection && !prev.isPlaying) {
      play({ id: 'moodist', title: 'Ambient Mix', subtitle: `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`, type: 'moodist' })
    } else if (now.isPlaying && now.hasSelection && prev.isPlaying) {
      setPlayInfo('Ambient Mix', `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`)
    } else if (!now.isPlaying && now.hasSelection) {
      setPlaying(false)
    } else if (!now.hasSelection) {
      stopPlayer()
    }
    prevPlayingState.current = now
  }, [state.isPlaying, selectedCount, play, setPlayInfo, setPlaying, stopPlayer])

  // Auto-stop when all sounds deselected
  useEffect(() => {
    const hasSelection = Object.values(state.sounds).some((s) => s.selected)
    if (state.isPlaying && !hasSelection) dispatch({ type: 'SET_PLAYING', playing: false })
  }, [state.isPlaying, state.sounds])

  const hasSelection = useMemo(() => Object.values(state.sounds).some((s) => s.selected), [state.sounds])
  const hasNoSelection = !hasSelection

  const handleTogglePlay = useCallback(() => {
    if (hasNoSelection) return
    dispatch({ type: 'SET_PLAYING', playing: !state.isPlaying })
  }, [state.isPlaying, hasNoSelection])

  const handleShuffle = useCallback(() => dispatch({ type: 'SHUFFLE' }), [])
  const handleUnselectAll = useCallback(() => dispatch({ type: 'UNSELECT_ALL' }), [])
  const handleApplyPreset = useCallback((presetSounds: Record<string, number>) => {
    dispatch({ type: 'OVERRIDE', sounds: presetSounds })
    dispatch({ type: 'SET_PLAYING', playing: true })
    closePresets()
  }, [closePresets])

  const favoriteIds = useMemo(() =>
    Object.entries(state.sounds).filter(([, s]) => s.favorite).map(([id]) => id),
    [state.sounds],
  )

  const allSounds = useMemo(() => getAllSounds(), [])

  const favoriteSounds = useMemo(() =>
    favoriteIds.map((id) => allSounds.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => s != null),
    [favoriteIds, allSounds],
  )

  const allCategories = useMemo(() => {
    if (favoriteSounds.length === 0) return categories
    return [{ id: 'favorites', title: 'Favorites', icon: 'lucide:heart', sounds: favoriteSounds }, ...categories]
  }, [favoriteSounds])

  useHotkeys([['alt + N', handleTogglePlay]])

  const statusMessage = !hasSelection
    ? 'No sounds selected'
    : !state.isPlaying ? `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} paused`
    : `Playing ${selectedCount} sound${selectedCount !== 1 ? 's' : ''}`

  return (
    <Container size="xl" py="md">
      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {statusMessage}
      </div>

      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            Moodist
          </Text>
          <Badge size="sm" variant="light">{allSounds.length} sounds</Badge>
        </Group>
        <Group gap="xs">
          <Icon icon="lucide:sparkles" width={18} style={{ cursor: 'pointer' }} onClick={openPresets} />
          <Icon icon="lucide:moon" width={18} style={{ cursor: 'pointer' }} onClick={openSleep} />
        </Group>
      </Group>

      <PlayerControls
        isPlaying={state.isPlaying}
        hasSelection={hasSelection}
        onTogglePlay={handleTogglePlay}
        onShuffle={handleShuffle}
        onUnselectAll={handleUnselectAll}
      />

      {allCategories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          soundsState={state.sounds}
          isGloballyPlaying={state.isPlaying}
          onSelect={(id) => dispatch({ type: 'SELECT', id })}
          onUnselect={(id) => dispatch({ type: 'UNSELECT', id })}
          onSetVolume={(id, vol) => dispatch({ type: 'SET_VOLUME', id, volume: vol })}
          onToggleFavorite={(id) => dispatch({ type: 'TOGGLE_FAVORITE', id })}
        />
      ))}

      <BinauralPanel />
      <NoisePanel />

      <Drawer opened={presetsOpen} onClose={closePresets} title="Presets" position="bottom" size="auto">
        <PresetsPanel sounds={state.sounds} onApplyPreset={handleApplyPreset} />
      </Drawer>

      <Drawer opened={sleepOpen} onClose={closeSleep} title="Sleep Timer" position="bottom" size="auto">
        <SleepTimer onSleep={() => { dispatch({ type: 'SET_PLAYING', playing: false }); closeSleep() }} />
      </Drawer>
    </Container>
  )
}
