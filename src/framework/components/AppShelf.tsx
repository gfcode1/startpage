import { useState, useEffect } from 'react'
import { useGfTheme } from '../ThemeProvider'
import { GfIcon } from '../iconSystem'
import { DockContent } from './AppDock'
import { SettingsModal } from './SettingsModal'
import './AppShelf.css'

function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return <span className="gf-shelf__clock">{fmt}</span>
}

export function AppShelf() {
  const { activeTheme } = useGfTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <div className="gf-shelf">
        <div className="gf-shelf__inner">
          <div className="gf-shelf__center">
            <DockContent />
          </div>

          <div className="gf-shelf__right">
            <Clock />
            <span className="gf-shelf__theme-dot" style={{ background: activeTheme?.colors?.accent }} title={activeTheme?.name} />
            <button
              className="gf-shelf__btn"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              title="Settings"
            >
              <GfIcon name="gear" size={16} />
            </button>
          </div>
        </div>
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
