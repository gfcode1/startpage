import { memo, useCallback, useEffect } from 'react'
import { ActionIcon, Slider, Loader, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Sound, SoundState } from '../types'
import { useSoundPlayer } from '../hooks/useSoundPlayer'

interface SoundCardProps {
  sound: Sound
  state: SoundState
  isGloballyPlaying: boolean
  onSelect: () => void
  onUnselect: () => void
  onSetVolume: (volume: number) => void
  onToggleFavorite: () => void
  hidden: boolean
}

export const SoundCard = memo(function SoundCard({
  sound, state, isGloballyPlaying, onSelect, onUnselect,
  onSetVolume, onToggleFavorite, hidden,
}: SoundCardProps) {
  const player = useSoundPlayer(sound.src)

  useEffect(() => {
    if (state.selected && isGloballyPlaying) player.play()
    else player.pause()
  }, [state.selected, player, isGloballyPlaying])

  useEffect(() => { player.setVolume(state.volume) }, [state.volume, player])

  const handleToggle = useCallback(() => {
    if (state.selected) onUnselect()
    else onSelect()
  }, [state.selected, onSelect, onUnselect])

  const isActive = state.selected && isGloballyPlaying

  if (hidden) return null

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${sound.label} sound`}
      onClick={handleToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle() } }}
      style={{
        position: 'relative',
        padding: 12,
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        cursor: 'pointer',
        background: state.selected
          ? 'var(--mantine-color-accent-5)'
          : 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-8))',
        transition: 'all 0.15s',
        display: state.selected && isActive ? 'block' : undefined,
        boxShadow: isActive ? '0 0 12px var(--mantine-color-accent-5)' : undefined,
      }}
    >
      <ActionIcon
        variant="subtle"
        size="xs"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
        aria-label={`Favorite ${sound.label}`}
        style={{ position: 'absolute', top: 4, right: 4, color: state.favorite ? 'var(--mantine-color-accent-5)' : undefined }}
      >
        <Icon icon={state.favorite ? 'lucide:heart' : 'lucide:heart-off'} width={12} />
      </ActionIcon>

      {player.isLoading && <Loader size="xs" style={{ position: 'absolute', top: 4, left: 4 }} />}
      {player.hasError && <Text size="xs" c="red" style={{ position: 'absolute', top: 4, left: 4 }}>!</Text>}

      <Text size="sm" ta="center" style={{ marginTop: 8 }}>{sound.label}</Text>

      <div style={{ marginTop: 6 }}>
        <Slider
          value={state.volume}
          onChange={onSetVolume}
          min={0}
          max={1}
          step={0.01}
          size="xs"
          disabled={!state.selected}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${sound.label} volume`}
        />
      </div>
    </div>
  )
})
