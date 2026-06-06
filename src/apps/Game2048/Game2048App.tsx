import { useRef, useEffect, useState, useCallback } from 'react'
import { StorageManager } from '../../framework/storage/StorageManager'
import { persistenceService } from '../../framework/persistence/PersistenceService'
import type { HighScoreEntry } from '../../framework/storage/types'
import { AudioEngine } from '../../framework/engine/AudioEngine'
import { Game2048Engine } from './Game2048Engine'
import { GfButton } from '../../framework/components/Button'
import './Game2048App.css'

const BEST_SCORE_KEY = 'bestScore'
const HIGH_SCORES_KEY = 'highScores'
const MAX_HIGH_SCORES = 10

export default function Game2048App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Game2048Engine | null>(null)

  const [showResume, setShowResume] = useState(() => {
    const s = new StorageManager('game2048')
    return s.get<unknown>('gameState') !== null
  })
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const s = new StorageManager('game2048')
    return s.get<number>(BEST_SCORE_KEY, 0) ?? 0
  })
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [paused, setPaused] = useState(false)
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    const s = new StorageManager('game2048')
    return s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
  })
  const [finalScore, setFinalScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)

  useEffect(() => {
    persistenceService.registerNamespace('game2048', BEST_SCORE_KEY, HIGH_SCORES_KEY, 'gameState')
  }, [])

  const engineStart = useCallback((engine: Game2048Engine, fn: (e: Game2048Engine) => void) => {
    fn(engine)
    engine.start()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = new AudioEngine()
    const s = new StorageManager('game2048')

    const engine = new Game2048Engine(canvas, {
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
        onWin: (sc) => {
          setWon(true)
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

    if (!s.get<unknown>('gameState')) {
      engineStart(engine, (e) => e.newGame())
    }

    const onVisibility = () => {
      if (document.hidden && engine.running) {
        engine.pause()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      engine.destroy()
      window.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const s = new StorageManager('game2048')
    const saved = s.get<unknown>('gameState')
    if (!saved) return
    engineStart(engine, (e) => e.loadGameFromState(saved))
    setScore(engine.score)
    setBestScore(engine.bestScore)
    if (engine.gameOver) {
      setGameOver(true)
      setFinalScore(engine.score)
    }
    if (engine.won) {
      setWon(true)
      setFinalScore(engine.score)
    }
    setShowResume(false)
  }, [engineStart])

  const handleNewGame = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const s = new StorageManager('game2048')
    s.remove('gameState')
    setScore(0)
    setGameOver(false)
    setWon(false)
    setFinalScore(0)
    setShowNameInput(false)
    setShowResume(false)
    engineStart(engine, (e) => e.newGame())
  }, [engineStart])

  const handlePause = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.paused) engine.resume()
    else engine.pause()
  }, [])

  const handleSaveScore = useCallback(() => {
    const name = playerName.trim() || 'Anonymous'
    const entry: HighScoreEntry = { name, score: finalScore, date: new Date().toISOString() }
    const s = new StorageManager('game2048')
    const current = s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
    current.push(entry)
    current.sort((a, b) => b.score - a.score)
    const top = current.slice(0, MAX_HIGH_SCORES)
    s.set(HIGH_SCORES_KEY, top)
    s.remove('gameState')
    setHighScores(top)
    setShowNameInput(false)
  }, [playerName, finalScore])

  const handleContinueAfterWin = useCallback(() => {
    setWon(false)
    setFinalScore(0)
  }, [])

  return (
    <div className="gf-game">
      <h1 className="gf-sr-only">2048</h1>
      <div className="gf-game__header">
        <div className="gf-game__scores">
          <div className="gf-game__score-box">
            <span className="gf-game__score-label">SCORE</span>
            <span className="gf-game__score-value">{score}</span>
          </div>
          <div className="gf-game__score-box gf-game__score-box--best">
            <span className="gf-game__score-label">BEST</span>
            <span className="gf-game__score-value">{bestScore}</span>
          </div>
        </div>
        <div className="gf-game__actions">
          <button
            className="gf-btn gf-btn--icon"
            onClick={handlePause}
            aria-label={paused ? 'Resume' : 'Pause'}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <polygon points="5,3 15,9 5,15" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor"/>
                <rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor"/>
              </svg>
            )}
          </button>
          <GfButton variant="secondary" size="sm" onClick={handleNewGame}>
            New
          </GfButton>
        </div>
      </div>

      <div className="gf-game__board">
        <canvas ref={canvasRef} className="gf-game__canvas" tabIndex={0} />

        {showResume && (
          <div className="gf-game__overlay">
            <div className="gf-game__dialog">
              <h2 className="gf-game__dialog-title">Saved game found</h2>
              <p className="gf-game__dialog-desc">Continue previous game?</p>
              <div className="gf-game__dialog-actions">
                <GfButton variant="primary" size="md" onClick={handleContinue}>
                  Continue
                </GfButton>
                <GfButton variant="secondary" size="md" onClick={handleNewGame}>
                  New game
                </GfButton>
              </div>
            </div>
          </div>
        )}

        {paused && !gameOver && !showResume && (
          <div className="gf-game__overlay">
            <div className="gf-game__dialog">
              <h2 className="gf-game__dialog-title">Paused</h2>
              <GfButton variant="primary" size="md" onClick={handlePause}>
                Resume
              </GfButton>
            </div>
          </div>
        )}
      </div>

      <div className="gf-game__footer">
        <GfButton variant="primary" size="md" onClick={handleNewGame}>
          New game
        </GfButton>
      </div>

      {(gameOver || won) && !showNameInput && !showResume && (
        <div className="gf-game__overlay gf-game__overlay--full">
          <div className="gf-game__dialog">
            <h2 className="gf-game__dialog-title">
              {won ? 'You win!' : 'Game Over'}
            </h2>
            <p className="gf-game__dialog-score">{finalScore}</p>
            {finalScore > 0 && (
              <GfButton variant="primary" size="md" onClick={() => setShowNameInput(true)}>
                Save score
              </GfButton>
            )}
            {won && (
              <GfButton variant="secondary" size="md" onClick={handleContinueAfterWin}>
                Keep playing
              </GfButton>
            )}
            <GfButton variant="ghost" size="md" onClick={handleNewGame}>
              New game
            </GfButton>
          </div>
        </div>
      )}

      {showNameInput && (
        <div className="gf-game__overlay gf-game__overlay--full">
          <div className="gf-game__dialog">
            <h2 className="gf-game__dialog-title">Save score</h2>
            <p className="gf-game__dialog-score">{finalScore}</p>
            <input
              className="gf-game__name-input"
              type="text"
              placeholder="Your name"
              maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScore() }}
              autoFocus
            />
            <GfButton variant="primary" size="md" onClick={handleSaveScore}>
              Save
            </GfButton>
          </div>
        </div>
      )}

      {highScores.length > 0 && (
        <div className="gf-game__highscores">
          <h3 className="gf-game__highscores-title">Leaderboard</h3>
          <ol className="gf-game__highscores-list">
            {highScores.slice(0, MAX_HIGH_SCORES).map((entry, i) => (
              <li key={entry.date + entry.name} className="gf-game__highscores-item">
                <span className="gf-game__highscores-rank">#{i + 1}</span>
                <span className="gf-game__highscores-name">{entry.name}</span>
                <span className="gf-game__highscores-score">{entry.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
