import { useState, useEffect, useRef, useCallback } from 'react'
import { type SystemId, type ScannedGame, EXTENSION_TO_SYSTEM, ALL_EXTENSIONS } from './constants'
import { SystemFilter } from './SystemFilter'
import { GameCard } from './GameCard'
import { GameView } from './GameView'
import { saveRom, getRom, getAllRomMetas } from './romStorage'
import { scanBundledRoms } from './romScanner'
import './EmulatorLauncherApp.css'

interface GameEntry {
  id: string
  title: string
  system: SystemId
  fileName: string
  storedRomId?: string
  romUrl?: string
}

function toScannedGame(entry: GameEntry): ScannedGame {
  return { id: entry.id, title: entry.title, system: entry.system, fileName: entry.fileName, romUrl: entry.romUrl }
}

export default function EmulatorLauncherApp() {
  const [games, setGames] = useState<GameEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null)
  const [activeRomData, setActiveRomData] = useState<ArrayBuffer | undefined>()
  const [filter, setFilter] = useState<SystemId | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [metas, bundled] = await Promise.all([
        getAllRomMetas().catch(() => [] as import('./romStorage').StoredRomMeta[]),
        scanBundledRoms(),
      ])

      if (cancelled) return

      const userGames: GameEntry[] = metas.map(m => ({
        id: m.id,
        title: m.title,
        system: m.system,
        fileName: m.fileName,
        storedRomId: m.id,
      }))

      const userKeys = new Set(userGames.map(g => `${g.system}:${g.fileName}`))
      const bundledGames: GameEntry[] = bundled
        .filter(g => !userKeys.has(`${g.system}:${g.fileName}`))
        .map(g => ({
          id: g.id,
          title: g.title,
          system: g.system,
          fileName: g.fileName,
          romUrl: g.romUrl,
        }))

      setGames([...userGames, ...bundledGames])
    }

    load()
      .catch(err => setLoadError(`Failed to load game library: ${err.message}`))
      .finally(() => setLoading(false))

    return () => { cancelled = true }
  }, [])

  async function handleFile(file: File) {
    const dotIdx = file.name.lastIndexOf('.')
    if (dotIdx < 0) return
    const ext = file.name.slice(dotIdx).toLowerCase()
    const system = EXTENSION_TO_SYSTEM[ext]
    if (!system) return

    const title = file.name.slice(0, dotIdx)
    const id = `browser:${system}:${file.name}`

    const data = await file.arrayBuffer()
    await saveRom({ id, title, system, fileName: file.name, data, addedAt: Date.now(), romSize: file.size })

    setGames(prev => prev.some(g => g.id === id) ? prev : [...prev, { id, title, system, fileName: file.name, storedRomId: id }])
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      await handleFile(file)
    }
    e.target.value = ''
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragTimerRef.current !== null) clearTimeout(dragTimerRef.current)
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragTimerRef.current !== null) clearTimeout(dragTimerRef.current)
    dragTimerRef.current = setTimeout(() => setDragging(false), 50)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragTimerRef.current !== null) clearTimeout(dragTimerRef.current)
    setDragging(false)
    const files = e.dataTransfer.files
    if (!files) return
    for (const file of Array.from(files)) {
      await handleFile(file)
    }
  }

  async function handlePlay(entry: GameEntry) {
    if (entry.romUrl) {
      setActiveRomData(undefined)
      setActiveGame(entry)
      return
    }
    if (entry.storedRomId) {
      const rom = await getRom(entry.storedRomId)
      if (!rom) return
      setActiveRomData(rom.data)
      setActiveGame(entry)
    }
  }

  const filteredGames = filter ? games.filter(g => g.system === filter) : games

  if (activeGame) {
    return (
      <GameView
        game={toScannedGame(activeGame)}
        romData={activeRomData}
        onBack={() => { setActiveGame(null); setActiveRomData(undefined) }}
      />
    )
  }

  return (
    <div
      className="gf-emu"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="gf-emu__hero">
        <h1 className="gf-emu__title">EmulatorJS</h1>
        {!loading && games.length > 0 && (
          <p className="gf-emu__subtitle">
            {games.length} game{games.length !== 1 ? 's' : ''} across {new Set(games.map(g => g.system)).size} console{new Set(games.map(g => g.system)).size !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      <div className="gf-emu__toolbar">
        <SystemFilter selected={filter} onChange={setFilter} />
      </div>

      <div className="gf-emu__actions">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALL_EXTENSIONS.join(',')}
          multiple
          onChange={handleFileSelect}
          hidden
        />
        <button className="gf-emu__load-btn" onClick={() => fileInputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Load ROM
        </button>
      </div>

      {dragging && <div className="gf-emu__dropzone">Drop ROM files here</div>}

      {loadError && <div className="gf-emu__scan-error">{loadError}</div>}

      {loading && (
        <div className="gf-emu__empty">
          <div className="gf-emu__view-spinner" />
          <p>Loading game library…</p>
        </div>
      )}

      {!loading && !loadError && games.length === 0 && (
        <div className="gf-emu__empty">
          <p>No games loaded.</p>
          <p className="gf-emu__empty-hint">
            Drag & drop ROM files here, or click <strong>Load ROM</strong> to browse.
          </p>
        </div>
      )}

      {!loading && games.length > 0 && filteredGames.length === 0 && (
        <div className="gf-emu__empty">
          <p>No games match the selected filter.</p>
        </div>
      )}

      {filteredGames.length > 0 && (
        <div className="gf-emu__grid">
          {filteredGames.map((game, i) => (
            <GameCard
              key={game.id}
              game={toScannedGame(game)}
              index={i}
              onClick={() => handlePlay(game)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
