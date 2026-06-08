import { GfIcon } from '../../framework/iconSystem'
import { SYSTEM_MAP, type ScannedGame } from './constants'

interface GameCardProps {
  game: ScannedGame
  index: number
  onClick: () => void
  onDelete?: () => void
}

export function GameCard({ game, index, onClick, onDelete }: GameCardProps) {
  const meta = SYSTEM_MAP[game.system]

  return (
    <div
      className="gf-emu__card"
      style={{
        '--card-color': meta?.color ?? 'var(--gf-accent)',
        '--card-gradient': meta?.gradient ?? 'var(--gf-accent)',
        '--card-index': index,
      } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Play ${game.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="gf-emu__card-accent" style={{ background: meta?.gradient ?? 'var(--gf-accent)' }} />
      <div className="gf-emu__card-body">
        <div className="gf-emu__card-head">
          {meta && (
            <span className="gf-emu__card-badge" style={{ background: meta.color }}>
              {meta.label}
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              className="gf-emu__card-delete"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              aria-label={`Delete ${game.title}`}
            >
              <GfIcon name="delete" size={14} />
            </button>
          )}
        </div>
        <h3 className="gf-emu__card-title">{game.title}</h3>
        <span className="gf-emu__card-action">
          Play
          <GfIcon name="play" size={14} />
        </span>
      </div>
    </div>
  )
}
