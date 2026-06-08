import { GfIcon } from '../../../framework/iconSystem'

interface PlayerControlsProps {
  isPlaying: boolean
  hasSelection: boolean
  onTogglePlay: () => void
  onShuffle: () => void
  onUnselectAll: () => void
}

export function PlayerControls({
  isPlaying,
  hasSelection,
  onTogglePlay,
  onShuffle,
  onUnselectAll,
}: PlayerControlsProps) {
  return (
    <div className="gf-moodist__controls">
      <button
        className="gf-moodist__btn"
        disabled={!hasSelection}
        onClick={onTogglePlay}
        title={hasSelection ? (isPlaying ? 'Pause' : 'Play') : 'Select a sound first'}
      >
        <GfIcon name={isPlaying ? 'pause' : 'play'} size={16} />
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button
        className="gf-moodist__btn gf-moodist__btn--secondary"
        onClick={onShuffle}
        title="Shuffle — pick 5 random sounds"
      >
        <GfIcon name="shuffle" size={16} />
        Shuffle
      </button>

      <button
        className="gf-moodist__btn gf-moodist__btn--secondary"
        disabled={!hasSelection}
        onClick={onUnselectAll}
        title="Unselect all sounds"
      >
        <GfIcon name="clear" size={16} />
        Clear
      </button>
    </div>
  )
}
