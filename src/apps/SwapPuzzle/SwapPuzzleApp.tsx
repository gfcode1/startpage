import { useRef, useEffect, useState, useCallback } from 'react'
import { StorageManager } from '../../framework/storage/StorageManager'
import type { HighScoreEntry } from '../../framework/storage/types'
import { AudioEngine } from '../../framework/engine/AudioEngine'
import { SwapPuzzleEngine } from './SwapPuzzleEngine'
import { PhotoGallery } from '../../framework/components/PhotoGallery'
import { GameScoreboard } from '../../framework/components/GameScoreboard'
import { GameOverDialog } from '../../framework/components/GameOverDialog'
import { GfButton } from '../../framework/components/Button'
import { useGameTimer } from '../../framework/hooks/useGameTimer'
import { useTopbar } from '../../framework/TopbarContext'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'
import './SwapPuzzleApp.css'

const BEST_SCORE_KEY = 'bestScores'
const HIGH_SCORES_KEY = 'highScores'
const MAX_HIGH_SCORES = 10

type ViewState = 'gallery' | 'game'

const diffs = Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG['medium']][]

export default function SwapPuzzleApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SwapPuzzleEngine | null>(null)

  const [view, setView] = useState<ViewState>('gallery')
  const [imageLoading, setImageLoading] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [swapCount, setSwapCount] = useState(0)
  const [solved, setSolved] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [paused, setPaused] = useState(false)

  const [showResume, setShowResume] = useState(() => {
    const s = new StorageManager('swappuzzle')
    return s.get<unknown>('gameState') !== null
  })

  const { reset: resetTimer, formatTime } = useGameTimer(gameStarted && !solved && !paused)
  const { setActions, clearConfig } = useTopbar()

  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    const s = new StorageManager('swappuzzle')
    return s.get<Record<string, number>>(BEST_SCORE_KEY, { easy: 0, medium: 0, hard: 0 }) ?? { easy: 0, medium: 0, hard: 0 }
  })

  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    const s = new StorageManager('swappuzzle')
    return s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
  })
  const [finalScore, setFinalScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = new AudioEngine()
    const s = new StorageManager('swappuzzle')

    const engine = new SwapPuzzleEngine(canvas, {
      storage: s.provider,
      audio,
      callbacks: {
        onPauseState: (p) => { setPaused(p) },
      },
    })
    engineRef.current = engine

    const unlockAudio = () => {
      audio.init()
      window.removeEventListener('pointerdown', unlockAudio)
    }
    window.addEventListener('pointerdown', unlockAudio)

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

  const doSelectTile = useCallback((row: number, col: number) => {
    const engine = engineRef.current
    if (!engine || engine.solved) return
    engine.setFocus(row, col)
    engine.trySelectTile(row, col)
    setSwapCount(engine.swapCount)
  }, [])

  const initGame = useCallback((img: HTMLImageElement) => {
    requestAnimationFrame(() => {
      const engine = engineRef.current
      if (!engine) return
      engine.setImage(img)
      engine.newGame(difficulty)
      engine.setCallbacks(
        () => { setSwapCount(engine.swapCount) },
        () => {
          setSolved(true)
          setFinalScore(engine.swapCount)
          const store = new StorageManager('swappuzzle')
          const current = store.get<Record<string, number>>(BEST_SCORE_KEY, { easy: 0, medium: 0, hard: 0 }) ?? { easy: 0, medium: 0, hard: 0 }
          const prev = current[difficulty]
          if (prev === 0 || engine.swapCount < prev) {
            current[difficulty] = engine.swapCount
            store.set(BEST_SCORE_KEY, current)
            setBestScores(current)
          }
        },
      )
      engine.start()
      setImageLoading(false)
      setGameStarted(true)
      setShowResume(false)
    })
  }, [difficulty])

  const startGame = useCallback((img: HTMLImageElement) => {
    setView('game')
    setImageLoading(true)
    setSolved(false)
    setSwapCount(0)
    resetTimer()
    initGame(img)
  }, [initGame, resetTimer])

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (!engine || engine.solved || engine.paused || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / (rect.width / engine.cols))
    const row = Math.floor(y / (rect.height / engine.rows))
    doSelectTile(row, col)
  }, [doSelectTile])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (!engine || engine.solved || engine.paused) return
    let newR = engine.focusR
    let newC = engine.focusC
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        newR = Math.max(0, engine.focusR - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        newR = Math.min(engine.rows - 1, engine.focusR + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        newC = Math.max(0, engine.focusC - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        newC = Math.min(engine.cols - 1, engine.focusC + 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        doSelectTile(engine.focusR, engine.focusC)
        return
      default:
        return
    }
    engine.setFocus(newR, newC)
  }, [doSelectTile])

  const handlePause = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.paused) engine.resume()
    else engine.pause()
  }, [])

  const handleContinue = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const s = new StorageManager('swappuzzle')
    const saved = s.get<unknown>('gameState')
    if (!saved) return
    engine.loadGameFromState(saved)
    setSwapCount(engine.swapCount)
    setView('game')
    setGameStarted(true)
    setShowResume(false)
    setSolved(false)
    resetTimer()
    engine.setCallbacks(
      () => { setSwapCount(engine.swapCount) },
      () => {
        setSolved(true)
        setFinalScore(engine.swapCount)
        const store = new StorageManager('swappuzzle')
        const current = store.get<Record<string, number>>(BEST_SCORE_KEY, { easy: 0, medium: 0, hard: 0 }) ?? { easy: 0, medium: 0, hard: 0 }
        const prev = current[difficulty]
        if (prev === 0 || engine.swapCount < prev) {
          current[difficulty] = engine.swapCount
          store.set(BEST_SCORE_KEY, current)
          setBestScores(current)
        }
      },
    )
    engine.start()
  }, [difficulty, resetTimer])

  const handleRestart = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    setSolved(false)
    setSwapCount(0)
    setGameStarted(true)
    setFinalScore(0)
    setShowNameInput(false)
    resetTimer()
    engine.newGame(difficulty)
  }, [difficulty, resetTimer])

  const handleNewPhoto = useCallback(() => {
    const engine = engineRef.current
    if (engine) engine.stop()
    setView('gallery')
    setGameStarted(false)
    setSolved(false)
    setSwapCount(0)
    setFinalScore(0)
    setShowNameInput(false)
    resetTimer()
  }, [resetTimer])

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d)
    const engine = engineRef.current
    if (engine && view === 'game') {
      setSolved(false)
      setSwapCount(0)
      setGameStarted(true)
      setFinalScore(0)
      setShowNameInput(false)
      resetTimer()
      engine.newGame(d)
    }
  }, [view, resetTimer])

  const handleSaveScore = useCallback(() => {
    const name = playerName.trim() || 'Anonymous'
    const entry: HighScoreEntry = { name, score: finalScore, date: new Date().toISOString() }
    const s = new StorageManager('swappuzzle')
    const current = s.get<HighScoreEntry[]>(HIGH_SCORES_KEY, []) ?? []
    current.push(entry)
    current.sort((a, b) => a.score - b.score)
    const top = current.slice(0, MAX_HIGH_SCORES)
    s.set(HIGH_SCORES_KEY, top)
    s.remove('gameState')
    setHighScores(top)
    setShowNameInput(false)
  }, [playerName, finalScore])

  useEffect(() => {
    if (view !== 'game') {
      clearConfig()
      return
    }
    setActions([
      {
        id: 'pause',
        icon: paused ? 'play' : 'pause',
        label: paused ? 'Resume' : 'Pause',
        onClick: handlePause,
      },
      { id: 'new-photo', icon: 'image', label: 'New Photo', onClick: handleNewPhoto },
      { id: 'restart', icon: 'refresh', label: 'Reshuffle', onClick: handleRestart, variant: 'primary' },
    ])
    return clearConfig
  }, [view, paused, handlePause, handleNewPhoto, handleRestart, setActions, clearConfig])

  return (
    <>
      {view === 'gallery' && (
        <PhotoGallery
          difficulty={difficulty}
          difficulties={diffs.map(([k, c]) => ({ key: k, label: c.label }))}
          onDifficultyChange={(key) => handleDifficultyChange(key as Difficulty)}
          onPlay={startGame}
          bestScores={bestScores}
        />
      )}

      {view === 'game' && (
        <div className="gf-swap__game-wrap">
          <GameScoreboard
            moves={swapCount}
            movesLabel="SWAPS"
            time={formatTime()}
            best={bestScores[difficulty] || undefined}
            difficulty={difficulty}
            difficulties={diffs.map(([k, c]) => ({ key: k, label: c.label }))}
            onDifficultyChange={(key) => handleDifficultyChange(key as Difficulty)}
          />
        </div>
      )}

      <div className={`gf-swap__board${view !== 'game' ? ' gf-swap__board--hidden' : ''}`}>
        {imageLoading && view === 'game' && (
          <div className="gf-swap__overlay">
            <div className="gf-swap__dialog">
              <p>Loading image…</p>
            </div>
          </div>
        )}

        {showResume && view === 'gallery' && (
          <div className="gf-swap__overlay">
            <div className="gf-swap__dialog">
              <h2 className="gf-swap__dialog-title">Saved game found</h2>
              <p className="gf-swap__dialog-desc">Continue previous game?</p>
              <div className="gf-swap__dialog-actions">
                <GfButton variant="primary" size="md" onClick={handleContinue}>
                  Continue
                </GfButton>
                <GfButton variant="secondary" size="md" onClick={() => {
                  const s = new StorageManager('swappuzzle')
                  s.remove('gameState')
                  setShowResume(false)
                }}>
                  Dismiss
                </GfButton>
              </div>
            </div>
          </div>
        )}

        {paused && !solved && (
          <div className="gf-swap__overlay">
            <div className="gf-swap__dialog">
              <h2 className="gf-swap__dialog-title">Paused</h2>
              <GfButton variant="primary" size="md" onClick={handlePause}>
                Resume
              </GfButton>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="gf-swap__canvas"
          onPointerDown={view === 'game' && !paused ? handleCanvasPointerDown : undefined}
          onKeyDown={view === 'game' && !paused ? handleKeyDown : undefined}
          tabIndex={view === 'game' ? 0 : -1}
          role="application"
          aria-label="Swap puzzle. Use arrow keys to navigate, Enter or Space to select and swap tiles."
        />

        <GameOverDialog
          show={solved && !showNameInput}
          score={swapCount}
          scoreLabel="swaps"
          time={formatTime()}
          best={bestScores[difficulty] || undefined}
          onNewPhoto={handleNewPhoto}
          onPlayAgain={handleRestart}
        />
      </div>

      {solved && !showNameInput && (
        <div className="gf-swap__actions-row">
          {finalScore > 0 && (
            <GfButton variant="primary" size="md" onClick={() => {
              setSolved(false)
              setShowNameInput(true)
            }}>
              Save Score
            </GfButton>
          )}
        </div>
      )}

      {showNameInput && (
        <div className="gf-swap__overlay-full">
          <div className="gf-swap__dialog">
            <h2 className="gf-swap__dialog-title">Save Score</h2>
            <p className="gf-swap__dialog-score">{finalScore}</p>
            <input
              className="gf-swap__name-input"
              type="text"
              aria-label="Your name"
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
        <div className="gf-swap__highscores">
          <h3 className="gf-swap__highscores-title">Leaderboard</h3>
          <ol className="gf-swap__highscores-list">
            {highScores.slice(0, MAX_HIGH_SCORES).map((entry, i) => (
              <li key={entry.date + entry.name} className="gf-swap__highscores-item">
                <span className="gf-swap__highscores-rank">#{i + 1}</span>
                <span className="gf-swap__highscores-name">{entry.name}</span>
                <span className="gf-swap__highscores-score">{entry.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
