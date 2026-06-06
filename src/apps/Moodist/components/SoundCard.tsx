import { memo, useCallback, useEffect } from 'react'
import type { Sound, SoundState } from '../types'
import { useSoundPlayer } from '../hooks/useSoundPlayer'

interface SoundCardProps {
  sound: Sound
  state: SoundState
  isGloballyPlaying: boolean
  isLocked: boolean
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
  isLocked,
  onSelect,
  onUnselect,
  onSetVolume,
  onToggleFavorite,
  hidden,
}: SoundCardProps) {
  const player = useSoundPlayer(sound.src)

  useEffect(() => {
    if (isLocked) return
    if (state.selected && isGloballyPlaying) {
      player.play()
    } else {
      player.pause()
    }
  }, [state.selected, player, isGloballyPlaying, isLocked])

  useEffect(() => {
    player.setVolume(state.volume)
  }, [state.volume, player])

  const handleToggle = useCallback(() => {
    if (isLocked) return
    if (state.selected) onUnselect()
    else onSelect()
  }, [state.selected, onSelect, onUnselect, isLocked])

  const handleVolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return
    const vol = Number(e.target.value)
    onSetVolume(vol)
  }, [onSetVolume, isLocked])

  return (
    <div
      className={`gf-moodist__sound ${state.selected ? 'gf-moodist__sound--selected' : ''} ${hidden ? 'gf-moodist__sound--hidden' : ''}`}
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
        {state.favorite ? '\u2764' : '\u2661'}
      </button>

      <div className="gf-moodist__sound-label" style={{ position: 'absolute', top: 4, left: 6, fontSize: 9, opacity: 0.5 }}>
        {player.isLoading ? '\u23F3' : ''}
      </div>

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
