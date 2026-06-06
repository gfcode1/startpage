import { SYSTEM_MAP, type ScannedGame } from './constants'

interface GameCardProps {
  game: ScannedGame
  index: number
  onClick: () => void
}

export function GameCard({ game, index, onClick }: GameCardProps) {
  const meta = SYSTEM_MAP[game.system]

  return (
    <div
      className="gf-emu__card"
      style={{
        '--card-color': meta.color,
        '--card-gradient': meta.gradient,
        '--card-index': index,
      } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Play ${game.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="gf-emu__card-accent" style={{ background: meta.gradient }} />
      <div className="gf-emu__card-body">
        <span className="gf-emu__card-badge" style={{ background: meta.color }}>
          {meta.label}
        </span>
        <h3 className="gf-emu__card-title">{game.title}</h3>
        <span className="gf-emu__card-action">
          Play
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="4,2 12,7 4,12" fill="currentColor"/>
          </svg>
        </span>
      </div>
    </div>
  )
}
