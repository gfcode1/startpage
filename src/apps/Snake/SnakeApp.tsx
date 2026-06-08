import { useRef, useEffect, useState, useCallback } from 'react'
import { StorageManager } from '../../framework/storage/StorageManager'
import type { HighScoreEntry } from '../../framework/storage/types'
import { AudioEngine } from '../../framework/engine/AudioEngine'
import { SnakeEngine } from './SnakeEngine'
import { GfButton } from '../../framework/components/Button'
import { useTopbar } from '../../framework/TopbarContext'
import './SnakeApp.css'

const BEST_SCORE_KEY = 'bestScore'
const HIGH_SCORES_KEY = 'highScores'
const MAX_HIGH_SCORES = 10

export default function SnakeApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SnakeEngine | null>(null)

  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const s = new StorageManager('snake')
    return s.get<number>(BEST_SCORE_KEY, 0) ?? 0
  })
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    const s = new StorageManager('snake')
    return s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
  })
  const [finalScore, setFinalScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const { setActions, clearConfig } = useTopbar()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = new AudioEngine()
    const s = new StorageManager('snake')
    const savedState = s.get<unknown>('gameState')

    const engine = new SnakeEngine(canvas, {
      storage: s.provider,
      audio,
      callbacks: {
        onScoreChange: (sc) => { setScore(sc) },
        onBestScoreChange: (bs) => {
          setBestScore(bs)
          s.set(BEST_SCORE_KEY, bs)
        },
        onGameOver: (sc) => {
          setGameOver(true)
          setFinalScore(sc)
        },
        onPauseState: (p) => { setPaused(p) },
      },
    })

    engineRef.current = engine

    const unlockAudio = () => {
      audio.init()
      window.removeEventListener('pointerdown', unlockAudio)
    }
    window.addEventListener('pointerdown', unlockAudio)

    if (savedState) {
      engine.loadGameFromState(savedState)
    } else {
      engine.newGame()
    }
    engine.start()

    const onVisibility = () => {
      if (document.hidden && engine.running) {
        engine.pause()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      engine.destroy()
      audio.destroy()
      window.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const handleNewGame = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const s = new StorageManager('snake')
    s.remove('gameState')
    setScore(0)
    setGameOver(false)
    setPaused(false)
    setFinalScore(0)
    setShowNameInput(false)
    engine.newGame()
  }, [])

  const handlePause = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.paused) engine.resume()
    else engine.pause()
  }, [])

  useEffect(() => {
    setActions([
      {
        id: 'pause',
        icon: paused ? 'play' : 'pause',
        label: paused ? 'Resume' : 'Pause',
        onClick: handlePause,
      },
      { id: 'new-game', icon: 'plus', label: 'New Game', onClick: handleNewGame, variant: 'primary' },
    ])
    return () => { clearConfig() }
  }, [paused, handlePause, handleNewGame, setActions, clearConfig])

  const handleSaveScore = useCallback(() => {
    const name = playerName.trim() || 'Anonymous'
    const entry: HighScoreEntry = {
      name,
      score: finalScore,
      date: new Date().toISOString(),
    }
    const s = new StorageManager('snake')
    const current = s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
    current.push(entry)
    current.sort((a, b) => b.score - a.score)
    const top = current.slice(0, MAX_HIGH_SCORES)
    s.set(HIGH_SCORES_KEY, top)
    s.remove('gameState')
    setHighScores(top)
    setShowNameInput(false)
  }, [playerName, finalScore])

  return (
    <div className="gf-snake">
      <h1 className="gf-sr-only">Snake</h1>
      <div className="gf-snake__header">
        <div className="gf-snake__scores">
          <div className="gf-snake__score-box">
            <span className="gf-snake__score-label">SCORE</span>
            <span className="gf-snake__score-value">{score}</span>
          </div>
          <div className="gf-snake__score-box gf-snake__score-box--best">
            <span className="gf-snake__score-label">BEST</span>
            <span className="gf-snake__score-value">{bestScore}</span>
          </div>
        </div>
      </div>

      <div className="gf-snake__board">
        <canvas ref={canvasRef} className="gf-snake__canvas" tabIndex={0} />
        {paused && !gameOver && (
          <div className="gf-snake__overlay">
            <div className="gf-snake__dialog">
              <h2 className="gf-snake__dialog-title">Paused</h2>
              <GfButton variant="primary" size="md" onClick={handlePause}>
                Resume
              </GfButton>
            </div>
          </div>
        )}
      </div>

      {gameOver && !showNameInput && (
        <div className="gf-snake__overlay gf-snake__overlay--full">
          <div className="gf-snake__dialog">
            <h2 className="gf-snake__dialog-title">Game Over</h2>
            <p className="gf-snake__dialog-score">{finalScore}</p>
            {finalScore > 0 && (
              <GfButton
                variant="primary" size="md"
                onClick={() => setShowNameInput(true)}
              >
                Save Score
              </GfButton>
            )}
            <GfButton variant="ghost" size="md" onClick={handleNewGame}>
              New Game
            </GfButton>
          </div>
        </div>
      )}

      {showNameInput && (
        <div className="gf-snake__overlay gf-snake__overlay--full">
          <div className="gf-snake__dialog">
            <h2 className="gf-snake__dialog-title">Save Score</h2>
            <p className="gf-snake__dialog-score">{finalScore}</p>
            <input className="gf-snake__name-input" type="text"
              placeholder="Your name" maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveScore()
              }}
              autoFocus />
            <GfButton variant="primary" size="md" onClick={handleSaveScore}>
              Save
            </GfButton>
          </div>
        </div>
      )}

      {highScores.length > 0 && (
        <div className="gf-snake__highscores">
          <h3 className="gf-snake__highscores-title">High Scores</h3>
          <ol className="gf-snake__highscores-list">
            {highScores.slice(0, MAX_HIGH_SCORES).map((entry, i) => (
              <li key={entry.date + entry.name} className="gf-snake__highscores-item">
                <span className="gf-snake__highscores-rank">#{i + 1}</span>
                <span className="gf-snake__highscores-name">{entry.name}</span>
                <span className="gf-snake__highscores-score">{entry.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
