interface PlayerControlsProps {
  isPlaying: boolean
  hasSelection: boolean
  locked: boolean
  onTogglePlay: () => void
  onShuffle: () => void
  onUnselectAll: () => void
}

export function PlayerControls({
  isPlaying,
  hasSelection,
  locked,
  onTogglePlay,
  onShuffle,
  onUnselectAll,
}: PlayerControlsProps) {
  return (
    <div className="gf-moodist__controls">
      <button
        className="gf-moodist__btn"
        disabled={!hasSelection || locked}
        onClick={onTogglePlay}
        title={hasSelection ? (isPlaying ? 'Pause' : 'Play') : 'Select a sound first'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          {isPlaying ? (
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button
        className="gf-moodist__btn gf-moodist__btn--secondary"
        disabled={locked}
        onClick={onShuffle}
        title="Shuffle — pick 5 random sounds"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        Shuffle
      </button>

      <button
        className="gf-moodist__btn gf-moodist__btn--secondary"
        disabled={!hasSelection || locked}
        onClick={onUnselectAll}
        title="Unselect all sounds"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Clear
      </button>
    </div>
  )
}
