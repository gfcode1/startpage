import { GfButton } from './Button'
import './GameOverDialog.css'

interface GameOverDialogProps {
  show: boolean
  score: number
  scoreLabel?: string
  time: string
  best?: number
  onNewPhoto: () => void
  onPlayAgain: () => void
}

export function GameOverDialog({
  show, score, scoreLabel = '', time, best,
  onNewPhoto, onPlayAgain,
}: GameOverDialogProps) {
  if (!show) return null

  return (
    <div className="gf-gameover">
      <div className="gf-gameover__dialog">
        <h2 className="gf-gameover__title">Puzzle Complete!</h2>
        <p className="gf-gameover__score">{score} {scoreLabel}</p>
        <p className="gf-gameover__time">{time}</p>
        {best != null && best > 0 && (
          <p className="gf-gameover__best">Best: {best}</p>
        )}
        <div className="gf-gameover__actions">
          <GfButton variant="primary" size="md" onClick={onNewPhoto}>
            New Photo
          </GfButton>
          <GfButton variant="secondary" size="md" onClick={onPlayAgain}>
            Play Again
          </GfButton>
        </div>
      </div>
    </div>
  )
}
