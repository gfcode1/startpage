import { useRef, useState, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { SYSTEM_MAP, type ScannedGame } from './constants'

interface GameViewProps {
  game: ScannedGame
  romData?: ArrayBuffer
  onBack: () => void
}

const LOAD_TIMEOUT_MS = 15_000

export function GameView({ game, romData, onBack }: GameViewProps) {
  const meta = SYSTEM_MAP[game.system]
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const romSentRef = useRef(false)

  const handleIframeLoad = () => {
    setLoading(false)
    if (!romSentRef.current && iframeRef.current && meta) {
      romSentRef.current = true
      const msg: Record<string, unknown> = {
        type: 'load-rom',
        core: meta.emulatorjsCore,
        title: game.title,
        emulatorjsDataUrl: 'https://cdn.emulatorjs.org/stable/data/',
      }
      if (romData) {
        const clone = romData.slice(0)
        msg.romData = clone
        iframeRef.current.contentWindow?.postMessage(msg, '*', [clone])
      } else if (game.romUrl) {
        msg.romUrl = game.romUrl
        iframeRef.current.contentWindow?.postMessage(msg, '*')
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setLoadError('Failed to load emulator — check your network connection.')
      }
    }, LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [loading])

  if (!meta) {
    return (
      <div className="gf-emu__view">
        <div className="gf-emu__view-header">
          <button className="gf-emu__view-back" onClick={onBack} aria-label="Back to library">
            <GfIcon name="chevron-left" size={18} />
            <span>Library</span>
          </button>
          <div className="gf-emu__view-info">
            <span className="gf-emu__view-title">{game.title}</span>
          </div>
          <div />
        </div>
        <div className="gf-emu__view-loading">
          <p>Unknown system: {game.system}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-emu__view">
      <div className="gf-emu__view-header">
        <button type="button" className="gf-emu__view-back" onClick={onBack} aria-label="Back to library">
          <GfIcon name="chevron-left" size={18} />
          <span>Library</span>
        </button>
        <div className="gf-emu__view-info">
          <span className="gf-emu__view-badge" style={{ background: meta.color }}>{meta.label}</span>
          <span className="gf-emu__view-title">{game.title}</span>
        </div>
        <div />
      </div>

      {loading && (
        <div className="gf-emu__view-loading">
          <div className="gf-emu__view-spinner" style={{ borderTopColor: meta.color }} />
          <p>Loading {game.title}…</p>
        </div>
      )}

      {loadError && (
        <div className="gf-emu__empty" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>{loadError}</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        className="gf-emu__view-iframe"
        src={`${import.meta.env.BASE_URL}emulator/player.html`}
        title={game.title}
        allow="fullscreen; gamepad"
        onLoad={handleIframeLoad}
      />
    </div>
  )
}
