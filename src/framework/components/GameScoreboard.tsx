import { GfButton } from './Button'
import './GameScoreboard.css'

interface GameScoreboardProps {
  moves: number
  movesLabel?: string
  time: string
  best?: number | string
  bestLabel?: string
  difficulty: string
  difficulties: { key: string; label: string }[]
  onDifficultyChange: (key: string) => void
}

export function GameScoreboard({
  moves, movesLabel = 'MOVES', time, best, bestLabel = 'BEST',
  difficulty, difficulties, onDifficultyChange,
}: GameScoreboardProps) {
  return (
    <div className="gf-scoreboard">
      <div className="gf-scoreboard__stats">
        <div className="gf-scoreboard__box">
          <span className="gf-scoreboard__label">{movesLabel}</span>
          <span className="gf-scoreboard__value">{moves}</span>
        </div>
        <div className="gf-scoreboard__box">
          <span className="gf-scoreboard__label">TIME</span>
          <span className="gf-scoreboard__value">{time}</span>
        </div>
        <div className="gf-scoreboard__box gf-scoreboard__box--best">
          <span className="gf-scoreboard__label">{bestLabel}</span>
          <span className="gf-scoreboard__value">{best != null && best !== 0 ? best : '—'}</span>
        </div>
      </div>
      <div className="gf-scoreboard__diffs">
        {difficulties.map(({ key, label }) => (
          <GfButton key={key} variant={difficulty === key ? 'primary' : 'ghost'} size="sm" onClick={() => onDifficultyChange(key)}>
            {label}
          </GfButton>
        ))}
      </div>
    </div>
  )
}
