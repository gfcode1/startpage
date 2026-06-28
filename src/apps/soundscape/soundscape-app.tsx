import { useReducer, useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { Container, Text, Group, Drawer, Badge, TextInput, Stack, Button, Accordion, Paper } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useHotkeys } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Icon } from '@iconify/react'
import { getStorage } from '@/lib/storage/engine'
import { registerRehydrator } from '@/lib/sync/rehydrate'
import { usePlayerPlay, usePlayerSetPlaying, usePlayerStop, usePlayerSetPlayInfo } from '@/stores/player-store'
import { categories, getAllSounds } from './data/sounds'
import { soundscapeReducer, createInitialState } from './reducer'
import type { SoundsState, SoundscapeAction } from './types'
import { CategorySection } from './components/CategorySection'
import { PlayerControls } from './components/PlayerControls'
import { PresetsPanel } from './components/PresetsPanel'
import { SleepTimer } from './components/SleepTimer'
import { BinauralPanel } from './components/BinauralPanel'
import { NoisePanel } from './components/NoisePanel'

const STORAGE_KEY = 'soundscape:state'

let _dispatch: React.Dispatch<SoundscapeAction> | null = null

registerRehydrator((storage) => {
  const data = storage.get<SoundsState>(STORAGE_KEY)
  if (data && _dispatch) {
    _dispatch({ type: 'LOAD', state: data })
  }
})

export default function SoundscapeApp() {
  const [state, dispatch] = useReducer(soundscapeReducer, getStorage().get<SoundsState>(STORAGE_KEY) ?? undefined, createInitialState)

  useEffect(() => {
    _dispatch = dispatch
    return () => { _dispatch = null }
  }, [dispatch])
  const [presetsOpen, { open: openPresets, close: closePresets }] = useDisclosure(false)
  const [sleepOpen, { open: openSleep, close: closeSleep }] = useDisclosure(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [masterVolume, setMasterVolume] = useState(1)
  const play = usePlayerPlay()
  const setPlayInfo = usePlayerSetPlayInfo()
  const setPlaying = usePlayerSetPlaying()
  const stopPlayer = usePlayerStop()
  const prevPlayingState = useRef({ isPlaying: false, hasSelection: false })

  const selectedCount = useMemo(() =>
    Object.values(state.sounds).filter((s) => s.selected).length,
    [state.sounds],
  )

  useEffect(() => { getStorage().set(STORAGE_KEY, state.sounds) }, [state.sounds])

  const hasSelection = selectedCount > 0

  useEffect(() => {
    const prev = prevPlayingState.current
    const now = { isPlaying: state.isPlaying, hasSelection }
    if (now.isPlaying && now.hasSelection && !prev.isPlaying) {
      play({ id: 'soundscape', title: 'Soundscape Mix', subtitle: `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`, type: 'soundscape' })
    } else if (now.isPlaying && now.hasSelection && prev.isPlaying) {
      setPlayInfo('Soundscape Mix', `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} playing`)
    } else if (!now.isPlaying && now.hasSelection) {
      setPlaying(false)
    } else if (!now.hasSelection) {
      stopPlayer()
    }
    prevPlayingState.current = now
  }, [state.isPlaying, selectedCount, hasSelection, play, setPlayInfo, setPlaying, stopPlayer])

  useEffect(() => {
    if (state.isPlaying && !hasSelection) dispatch({ type: 'SET_PLAYING', playing: false })
  }, [state.isPlaying, hasSelection])

  const handleTogglePlay = useCallback(() => {
    if (!hasSelection) return
    dispatch({ type: 'SET_PLAYING', playing: !state.isPlaying })
  }, [state.isPlaying, hasSelection])

  const handleShuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' })
    dispatch({ type: 'SET_PLAYING', playing: true })
    notifications.show({ title: 'Shuffled', message: 'Random sounds selected', color: 'accent' })
  }, [])

  const handleUnselectAll = useCallback(() => dispatch({ type: 'UNSELECT_ALL' }), [])

  const handleApplyPreset = useCallback((presetSounds: Record<string, number>, label?: string) => {
    dispatch({ type: 'OVERRIDE', sounds: presetSounds })
    dispatch({ type: 'SET_PLAYING', playing: true })
    closePresets()
    if (label) notifications.show({ title: 'Preset applied', message: label, color: 'accent' })
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

  const filteredCategories = useMemo(() => {
    const cats = categories.map((cat) => ({
      ...cat,
      sounds: searchQuery
        ? cat.sounds.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : cat.sounds,
    })).filter((cat) => cat.sounds.length > 0)

    const filteredFavorites = searchQuery
      ? favoriteSounds.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : favoriteSounds

    return { cats, hasFavorites: filteredFavorites.length > 0, favorites: filteredFavorites }
  }, [favoriteSounds, searchQuery])

  useHotkeys([
    ['alt + N', handleTogglePlay],
    ['space', handleTogglePlay],
    ['escape', handleUnselectAll],
  ])

  const statusMessage = !hasSelection
    ? 'No sounds selected'
    : !state.isPlaying ? `${selectedCount} sound${selectedCount !== 1 ? 's' : ''} paused`
    : `Playing ${selectedCount} sound${selectedCount !== 1 ? 's' : ''}`

  useEffect(() => {
    if (!state.isPlaying) return
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Soundscape Mix',
        artist: `${selectedCount} sounds playing`,
        album: 'Soundscape',
      })
      navigator.mediaSession.setActionHandler('play', () => dispatch({ type: 'SET_PLAYING', playing: true }))
      navigator.mediaSession.setActionHandler('pause', () => dispatch({ type: 'SET_PLAYING', playing: false }))
      navigator.mediaSession.setActionHandler('stop', () => { dispatch({ type: 'SET_PLAYING', playing: false }); dispatch({ type: 'UNSELECT_ALL' }) })
    }
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('stop', null)
      }
    }
  }, [state.isPlaying, selectedCount])

  const hasAnyVisibleSound = filteredCategories.cats.length > 0 || filteredCategories.hasFavorites

  return (
    <Container size="xl" py="md">
      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {statusMessage}
      </div>

      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="xs">
          <Icon icon="lucide:headphones" width={20} />
          <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
            Soundscape
          </Text>
          <Badge size="sm" variant="light">{allSounds.length} sounds</Badge>
        </Group>
        <Group gap="xs">
          <Icon icon="lucide:sparkles" width={18} style={{ cursor: 'pointer' }} onClick={openPresets} aria-label="Open presets" />
          <Icon icon="lucide:moon" width={18} style={{ cursor: 'pointer' }} onClick={openSleep} aria-label="Open sleep timer" />
        </Group>
      </Group>

      <TextInput
        placeholder="Search sounds..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        leftSection={<Icon icon="lucide:search" width={16} />}
        rightSection={searchQuery && (
          <Icon icon="lucide:x" width={16} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
        )}
        mb="md"
        size="sm"
      />

      <PlayerControls
        isPlaying={state.isPlaying}
        hasSelection={hasSelection}
        masterVolume={masterVolume}
        onTogglePlay={handleTogglePlay}
        onShuffle={handleShuffle}
        onUnselectAll={handleUnselectAll}
        onSetMasterVolume={setMasterVolume}
      />

      {!hasAnyVisibleSound && !hasSelection && (
        <Paper p="xl" ta="center" withBorder>
          <Stack align="center" gap="md">
            <Icon icon="lucide:music" width={48} style={{ opacity: 0.4 }} />
            <Text size="lg" fw={600}>Create your soundscape</Text>
            <Text size="sm" c="dimmed">Select sounds to layer together or try a random mix</Text>
            <Button
              variant="light"
              leftSection={<Icon icon="lucide:shuffle" width={16} />}
              onClick={handleShuffle}
            >
              Shuffle
            </Button>
          </Stack>
        </Paper>
      )}

      {filteredCategories.hasFavorites && (
        <CategorySection
          key="favorites"
          category={{ id: 'favorites', title: 'Favorites', icon: 'lucide:heart', sounds: filteredCategories.favorites }}
          soundsState={state.sounds}
          isGloballyPlaying={state.isPlaying}
          masterVolume={masterVolume}
          searchQuery=""
          isFavorites
          onSelect={(id) => dispatch({ type: 'SELECT', id })}
          onUnselect={(id) => dispatch({ type: 'UNSELECT', id })}
          onSetVolume={(id, vol) => dispatch({ type: 'SET_VOLUME', id, volume: vol })}
          onToggleFavorite={(id) => dispatch({ type: 'TOGGLE_FAVORITE', id })}
        />
      )}

      {filteredCategories.cats.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          soundsState={state.sounds}
          isGloballyPlaying={state.isPlaying}
          masterVolume={masterVolume}
          searchQuery={searchQuery}
          isFavorites={false}
          onSelect={(id) => dispatch({ type: 'SELECT', id })}
          onUnselect={(id) => dispatch({ type: 'UNSELECT', id })}
          onSetVolume={(id, vol) => dispatch({ type: 'SET_VOLUME', id, volume: vol })}
          onToggleFavorite={(id) => dispatch({ type: 'TOGGLE_FAVORITE', id })}
        />
      ))}

      <Accordion variant="filled" mb="md" defaultValue={null}>
        <Accordion.Item value="binaural">
          <Accordion.Control icon={<Icon icon="lucide:brain-circuit" width={18} />}>
            <Text fw={500}>Binaural Beats</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <BinauralPanel />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="noise">
          <Accordion.Control icon={<Icon icon="lucide:audio-waveform" width={18} />}>
            <Text fw={500}>Noise Generator</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <NoisePanel />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Drawer opened={presetsOpen} onClose={closePresets} title="Presets" position="bottom" size="auto">
        <PresetsPanel sounds={state.sounds} onApplyPreset={handleApplyPreset} />
      </Drawer>

      <Drawer opened={sleepOpen} onClose={closeSleep} title="Sleep Timer" position="bottom" size="auto">
        <SleepTimer onSleep={() => { dispatch({ type: 'SET_PLAYING', playing: false }); closeSleep(); notifications.show({ title: 'Sleep timer', message: 'Playback stopped', color: 'accent' }) }} />
      </Drawer>
    </Container>
  )
}
