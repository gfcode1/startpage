import { memo, useCallback, useEffect } from 'react'
import { GfIcon } from '../../../framework/iconSystem'
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
  sound,
  state,
  isGloballyPlaying,
  onSelect,
  onUnselect,
  onSetVolume,
  onToggleFavorite,
  hidden,
}: SoundCardProps) {
  const player = useSoundPlayer(sound.src)

  useEffect(() => {
    if (state.selected && isGloballyPlaying) {
      player.play()
    } else {
      player.pause()
    }
  }, [state.selected, player, isGloballyPlaying])

  useEffect(() => {
    player.setVolume(state.volume)
  }, [state.volume, player])

  const handleToggle = useCallback(() => {
    if (state.selected) onUnselect()
    else onSelect()
  }, [state.selected, onSelect, onUnselect])

  const handleVolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value)
    onSetVolume(vol)
  }, [onSetVolume])

  const isActive = state.selected && isGloballyPlaying

  return (
    <div
      className={`gf-moodist__sound ${state.selected ? 'gf-moodist__sound--selected' : ''} ${isActive ? 'gf-moodist__sound--playing' : ''} ${hidden ? 'gf-moodist__sound--hidden' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${sound.label} sound`}
      onClick={handleToggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleToggle() }}
    >
      <button
        className={`gf-moodist__sound-fav ${state.favorite ? 'gf-moodist__sound-fav--active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleFavorite() }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onToggleFavorite() } }}
        aria-label={`Favorite ${sound.label}`}
      >
        {state.favorite ? <GfIcon name="heart" size={12} /> : <GfIcon name="heart-outline" size={12} />}
      </button>

      {player.isLoading && (
        <div className="gf-moodist__sound-loading">
          <GfIcon name="loading" size={10} />
        </div>
      )}

      {player.hasError && (
        <div className="gf-moodist__sound-error" title="Failed to load sound">
          <GfIcon name="alert" size={10} />
        </div>
      )}

      {isActive && <div className="gf-moodist__sound-indicator" />}

      <input
        className="gf-moodist__sound-vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={state.volume}
        disabled={!state.selected}
        onClick={e => e.stopPropagation()}
        onChange={handleVolChange}
        aria-label={`${sound.label} volume`}
      />

      <div className="gf-moodist__sound-label">{sound.label}</div>
    </div>
  )
})
