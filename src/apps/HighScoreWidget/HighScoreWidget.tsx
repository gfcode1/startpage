import { useState } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { StorageManager } from '../../framework/storage/StorageManager'
import './HighScoreWidget.css'

import type { IconName } from '../../framework/iconSystem'

interface GameScore { id: string; name: string; icon: IconName; score: number | string }

const GAMES = [
  { id: 'game2048', name: '2048', icon: 'grid' },
  { id: 'snake', name: 'Snake', icon: 'snake' },
  { id: 'flappybird', name: 'Flappy Bird', icon: 'bird' },
]

function loadScore(game: typeof GAMES[number]): GameScore {
  const s = new StorageManager(game.id)
  const score = s.get<number>('bestScore', 0) ?? 0
  return { ...game, score }
}

export default function HighScoreWidget() {
  const [scores] = useState<GameScore[]>(() => GAMES.map(loadScore))
  const hasScores = scores.some(g => g.score !== 0)

  return (
    <div className="gf-widget-highscore">
      <div className="gf-widget-highscore__header">
        <GfIcon name="trophy" size={14} />
        <span className="gf-widget-highscore__label">High Scores</span>
      </div>
      {!hasScores ? (
        <span className="gf-widget-highscore__empty">Play games to see your scores</span>
      ) : (
        <div className="gf-widget-highscore__list">
          {scores.map(g => (
            <div key={g.id} className="gf-widget-highscore__row">
              <GfIcon name={g.icon} size={14} />
              <span className="gf-widget-highscore__game">{g.name}</span>
              <span className="gf-widget-highscore__score">{g.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
