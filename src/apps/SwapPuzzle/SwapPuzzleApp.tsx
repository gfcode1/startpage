import { useRef, useEffect, useState, useCallback } from 'react'
import { StorageManager } from '../../framework/storage/StorageManager'
import { AudioEngine } from '../../framework/engine/AudioEngine'
import { SwapPuzzleEngine } from './SwapPuzzleEngine'
import { PhotoGallery } from '../../framework/components/PhotoGallery'
import { GameScoreboard } from '../../framework/components/GameScoreboard'
import { GameOverDialog } from '../../framework/components/GameOverDialog'
import { useGameTimer } from '../../framework/hooks/useGameTimer'
import { useTopbar } from '../../framework/TopbarContext'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'
import './SwapPuzzleApp.css'

const BEST_SCORE_KEY = 'bestScores'

interface BestScores {
  easy: number
  medium: number
  hard: number
}

type ViewState = 'gallery' | 'game'

const diffs = Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG['medium']][]

export default function SwapPuzzleApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SwapPuzzleEngine | null>(null)
  const audioRef = useRef<AudioEngine | null>(null)

  const [view, setView] = useState<ViewState>('gallery')
  const [imageLoading, setImageLoading] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [swapCount, setSwapCount] = useState(0)
  const [solved, setSolved] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState(false)

  const { reset: resetTimer, formatTime } = useGameTimer(gameStarted && !solved)
  const { setActions, clearConfig } = useTopbar()

  const [bestScores, setBestScores] = useState<BestScores>(() => {
    const s = new StorageManager('swappuzzle')
    return s.get<BestScores>(BEST_SCORE_KEY, { easy: 0, medium: 0, hard: 0 }) ?? { easy: 0, medium: 0, hard: 0 }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = new AudioEngine()
    audioRef.current = audio
    const engine = new SwapPuzzleEngine(canvas, { audio })
    engineRef.current = engine

    const unlockAudio = () => {
      audio.init()
      window.removeEventListener('pointerdown', unlockAudio)
    }
    window.addEventListener('pointerdown', unlockAudio)

    return () => {
      engine.destroy()
      audio.destroy()
      audioRef.current = null
      window.removeEventListener('pointerdown', unlockAudio)
    }
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
          const store = new StorageManager('swappuzzle')
          const current = store.get<BestScores>(BEST_SCORE_KEY, { easy: 0, medium: 0, hard: 0 }) ?? { easy: 0, medium: 0, hard: 0 }
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
    })
  }, [difficulty])

  const startGame = useCallback((img: HTMLImageElement) => {
    setView('game')
    setImageLoading(true)
    setSolved(false)
    setSwapCount(0)
    setSelectedInfo(false)
    resetTimer()
    initGame(img)
  }, [initGame, resetTimer])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (!engine || engine.solved || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / (rect.width / engine.cols))
    const row = Math.floor(y / (rect.height / engine.rows))

    const hadSelection = engine.selectedR !== -1
    engine.trySelectTile(row, col)
    const hasSelection = engine.selectedR !== -1

    if (!hadSelection && hasSelection) setSelectedInfo(true)
    if (hadSelection && !hasSelection) setSelectedInfo(false)
    setSwapCount(engine.swapCount)
  }, [])

  const handleRestart = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    setSolved(false)
    setSwapCount(0)
    setGameStarted(true)
    setSelectedInfo(false)
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
    setSelectedInfo(false)
    resetTimer()
  }, [resetTimer])

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d)
    const engine = engineRef.current
    if (engine && view === 'game') {
      setSolved(false)
      setSwapCount(0)
      setGameStarted(true)
      setSelectedInfo(false)
      resetTimer()
      engine.newGame(d)
    }
  }, [view, resetTimer])

  useEffect(() => {
    if (view !== 'game') {
      clearConfig()
      return
    }
    setActions([
      { id: 'new-photo', icon: 'image', label: 'New Photo', onClick: handleNewPhoto },
      { id: 'restart', icon: 'refresh', label: 'Reshuffle', onClick: handleRestart, variant: 'primary' },
    ])
    return clearConfig
  }, [view, handleNewPhoto, handleRestart, setActions, clearConfig])

  return (
    <>
      {view === 'gallery' && (
        <PhotoGallery
          difficulty={difficulty}
          difficulties={diffs.map(([k, c]) => ({ key: k, label: c.label }))}
          onDifficultyChange={(key) => handleDifficultyChange(key as Difficulty)}
          onPlay={startGame}
          bestScores={bestScores as unknown as Record<string, number>}
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

          {selectedInfo && !solved && (
            <p className="gf-swap__instructions">Now tap another tile to swap</p>
          )}
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
        <canvas
          ref={canvasRef}
          className="gf-swap__canvas"
          onClick={view === 'game' ? handleCanvasClick : undefined}
          tabIndex={view === 'game' ? 0 : -1}
          role="application"
          aria-label="Swap puzzle. Tap a tile to select it, then tap another tile to swap their positions."
        />
        <GameOverDialog
          show={solved}
          score={swapCount}
          scoreLabel="swaps"
          time={formatTime()}
          best={bestScores[difficulty] || undefined}
          onNewPhoto={handleNewPhoto}
          onPlayAgain={handleRestart}
        />
      </div>
    </>
  )
}
