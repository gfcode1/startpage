import { memo, useCallback, useEffect } from 'react'
import { ActionIcon, Slider, Loader, Text, Card } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { Sound, SoundState } from '../types'
import { useSoundPlayer } from '../hooks/useSoundPlayer'

interface SoundCardProps {
  sound: Sound
  state: SoundState
  isGloballyPlaying: boolean
  masterVolume: number
  onSelect: () => void
  onUnselect: () => void
  onSetVolume: (volume: number) => void
  onToggleFavorite: () => void
}

export const SoundCard = memo(function SoundCard({
  sound, state, isGloballyPlaying, masterVolume,
  onSelect, onUnselect, onSetVolume, onToggleFavorite,
}: SoundCardProps) {
  const player = useSoundPlayer(sound.src)
  const effectiveVolume = state.volume * masterVolume

  useEffect(() => {
    if (state.selected && isGloballyPlaying) player.play()
    else player.pause()
  }, [state.selected, player, isGloballyPlaying])

  useEffect(() => { player.setVolume(effectiveVolume) }, [effectiveVolume, player])

  const handleToggle = useCallback(() => {
    if (state.selected) onUnselect()
    else onSelect()
  }, [state.selected, onSelect, onUnselect])

  const isActive = state.selected && isGloballyPlaying

  return (
    <Card
      role="button"
      tabIndex={0}
      padding="sm"
      style={{
        cursor: 'pointer',
        background: state.selected
          ? 'var(--mantine-color-accent-5)'
          : undefined,
        transition: 'all 0.15s',
        boxShadow: isActive ? '0 0 12px var(--mantine-color-accent-5)' : undefined,
      }}
      onClick={handleToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle() } }}
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

      <Text size="sm" ta="center">{sound.label}</Text>

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
        mt="xs"
      />
    </Card>
  )
})
