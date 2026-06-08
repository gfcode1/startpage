import { useState, useEffect, useRef, useCallback } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { type SystemId, type ScannedGame, EXTENSION_TO_SYSTEM, ALL_EXTENSIONS } from './constants'
import { SystemFilter } from './SystemFilter'
import { GameCard } from './GameCard'
import { GameView } from './GameView'
import { saveRom, getRom, getAllRomMetas, deleteRom } from './romStorage'
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
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

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

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (dragTimerRef.current !== null) {
        clearTimeout(dragTimerRef.current)
      }
    }
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
    try {
      await saveRom({ id, title, system, fileName: file.name, data, addedAt: Date.now(), romSize: file.size })
    } catch (err) {
      console.warn('Failed to save ROM to IndexedDB — storage may be full', err)
      return
    }

    setGames(prev => prev.some(g => g.id === id) ? prev : [...prev, { id, title, system, fileName: file.name, storedRomId: id }])
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const list = Array.from(files)
    setImportProgress({ current: 0, total: list.length })
    for (let i = 0; i < list.length; i++) {
      await handleFile(list[i])
      if (mountedRef.current) setImportProgress({ current: i + 1, total: list.length })
    }
    if (mountedRef.current) setImportProgress(null)
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
    dragTimerRef.current = setTimeout(() => { if (mountedRef.current) setDragging(false) }, 50)
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
    const list = Array.from(files)
    setImportProgress({ current: 0, total: list.length })
    for (let i = 0; i < list.length; i++) {
      await handleFile(list[i])
      if (mountedRef.current) setImportProgress({ current: i + 1, total: list.length })
    }
    if (mountedRef.current) setImportProgress(null)
  }

  async function handleDelete(entry: GameEntry) {
    if (!entry.storedRomId) return
    await deleteRom(entry.storedRomId)
    setGames(prev => prev.filter(g => g.id !== entry.id))
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

  const filteredGames = games
    .filter(g => (filter ? g.system === filter : true))
    .filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()))

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
        <input
          className="gf-emu__search"
          type="search"
          placeholder="Search games…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search games"
        />
        <button className="gf-emu__load-btn" type="button" onClick={() => fileInputRef.current?.click()}>
          <GfIcon name="plus" size={16} />
          Load ROM
        </button>
      </div>

      {importProgress && (
        <div className="gf-emu__import-progress">
          Importing {importProgress.current} of {importProgress.total}…
        </div>
      )}

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
              onDelete={game.storedRomId ? () => handleDelete(game) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
