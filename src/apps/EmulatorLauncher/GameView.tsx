import { useRef, useState } from 'react'
import { SYSTEM_MAP, type ScannedGame } from './constants'

interface GameViewProps {
  game: ScannedGame
  romData?: ArrayBuffer
  onBack: () => void
}

export function GameView({ game, romData, onBack }: GameViewProps) {
  const meta = SYSTEM_MAP[game.system]
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const romSentRef = useRef(false)

  const handleIframeLoad = () => {
    setLoading(false)
    if (!romSentRef.current && iframeRef.current) {
      romSentRef.current = true
      const msg: Record<string, unknown> = {
        type: 'load-rom',
        core: meta.emulatorjsCore,
        title: game.title,
      }
      if (romData) {
        msg.romData = romData
        iframeRef.current.contentWindow?.postMessage(msg, '*', [romData])
      } else if (game.romUrl) {
        msg.romUrl = game.romUrl
        iframeRef.current.contentWindow?.postMessage(msg, '*')
      }
    }
  }

  return (
    <div className="gf-emu__view">
      <div className="gf-emu__view-header">
        <button className="gf-emu__view-back" onClick={onBack} aria-label="Back to library">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
