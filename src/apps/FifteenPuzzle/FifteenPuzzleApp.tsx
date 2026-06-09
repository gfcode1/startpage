import { useRef, useEffect, useState, useCallback } from 'react'
import { AudioEngine } from '../../framework/engine/AudioEngine'
import { FifteenPuzzleEngine } from './FifteenPuzzleEngine'
import { PhotoGallery } from '../../framework/components/PhotoGallery'
import { GameScoreboard } from '../../framework/components/GameScoreboard'
import { GameOverDialog } from '../../framework/components/GameOverDialog'
import { useGameTimer } from '../../framework/hooks/useGameTimer'
import { useTopbar } from '../../framework/TopbarContext'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'
import './FifteenPuzzleApp.css'

type ViewState = 'gallery' | 'game'

const diffs = Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG['medium']][]

export default function FifteenPuzzleApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<FifteenPuzzleEngine | null>(null)
  const audioRef = useRef<AudioEngine | null>(null)

  const [view, setView] = useState<ViewState>('gallery')
  const [imageLoading, setImageLoading] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [moveCount, setMoveCount] = useState(0)
  const [solved, setSolved] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const { reset: resetTimer, formatTime } = useGameTimer(gameStarted && !solved)
  const { setActions, clearConfig } = useTopbar()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = new AudioEngine()
    audioRef.current = audio
    const engine = new FifteenPuzzleEngine(canvas, { audio })
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

  const startGame = useCallback((img: HTMLImageElement) => {
    setView('game')
    setImageLoading(true)
    setSolved(false)
    setMoveCount(0)
    resetTimer()

    requestAnimationFrame(() => {
      const engine = engineRef.current
      if (!engine) return
      engine.setImage(img)
      engine.newGame(difficulty)
      engine.setCallbacks(
        () => { setMoveCount(engine.moveCount) },
        () => { setSolved(true) },
      )
      engine.start()
      setImageLoading(false)
      setGameStarted(true)
    })
  }, [difficulty, resetTimer])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (!engine || engine.solved || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / (rect.width / engine.cols))
    const row = Math.floor(y / (rect.height / engine.rows))

    engine.tryMove(row, col)
    setMoveCount(engine.moveCount)
  }, [])

  const handleRestart = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    setSolved(false)
    setMoveCount(0)
    setGameStarted(true)
    resetTimer()
    engine.newGame(difficulty)
  }, [difficulty, resetTimer])

  const handleNewPhoto = useCallback(() => {
    const engine = engineRef.current
    if (engine) {
      engine.stop()
      engine.started = false
    }
    setView('gallery')
    setGameStarted(false)
    setSolved(false)
    setMoveCount(0)
    resetTimer()
  }, [resetTimer])

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d)
    const engine = engineRef.current
    if (engine && view === 'game') {
      setSolved(false)
      setMoveCount(0)
      setGameStarted(true)
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
        />
      )}

      {view === 'game' && (
        <div className="gf-puzzle__game-wrap">
          <GameScoreboard
            moves={moveCount}
            movesLabel="MOVES"
            time={formatTime()}
            difficulty={difficulty}
            difficulties={diffs.map(([k, c]) => ({ key: k, label: c.label }))}
            onDifficultyChange={(key) => handleDifficultyChange(key as Difficulty)}
          />
        </div>
      )}

      <div className={`gf-puzzle__board${view !== 'game' ? ' gf-puzzle__board--hidden' : ''}`}>
        {imageLoading && view === 'game' && (
          <div className="gf-puzzle__overlay">
            <div className="gf-puzzle__dialog">
              <p>Loading image…</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="gf-puzzle__canvas"
          onClick={view === 'game' ? handleCanvasClick : undefined}
          tabIndex={view === 'game' ? 0 : -1}
          role="application"
          aria-label="Photo puzzle game. Click a tile adjacent to the empty space to move it."
        />
        <GameOverDialog
          show={solved}
          score={moveCount}
          scoreLabel="moves"
          time={formatTime()}
          onNewPhoto={handleNewPhoto}
          onPlayAgain={handleRestart}
        />
      </div>
    </>
  )
}
