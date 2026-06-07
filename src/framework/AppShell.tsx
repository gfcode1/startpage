import { ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import { useGfTheme } from './ThemeProvider'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAppByPath } from './appRegistry'
import { useScrollToTop } from './hooks/useScrollToTop'
import { GfIcon } from './iconSystem'
import { SettingsModal } from './components/SettingsModal'
import { InstallPrompt } from './components/InstallPrompt'
import './AppShell.css'

export function AppShell({ children }: { children: ReactNode }) {
  useScrollToTop()
  const { themeKey, activeTheme } = useGfTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const app = getAppByPath(location.pathname)
  const isPopup = window.opener !== null || new URLSearchParams(window.location.search).has('popup')
  const [showSettings, setShowSettings] = useState(false)
  const [topbarHidden, setTopbarHidden] = useState(() => window.scrollY > 56)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY
    if (currentY > 56 && currentY > lastScrollY.current) {
      setTopbarHidden(true)
    } else {
      setTopbarHidden(false)
    }
    lastScrollY.current = currentY
    ticking.current = false
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(handleScroll)
        ticking.current = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  return (
    <div className="gf-shell">
      <a href="#main-content" className="gf-skip-link">
        Skip to content
      </a>

      <header className={`gf-topbar${topbarHidden && !isHome ? ' gf-topbar--hidden' : ''}`}>
        <nav className="gf-topbar__left" aria-label="Navigation">
          {isPopup ? (
            <button className="gf-topbar__close" onClick={() => window.close()} aria-label="Close">
              <GfIcon name="close" size={16} />
            </button>
          ) : !isHome && (
            <button className="gf-topbar__home" onClick={() => { console.log('[DEBUG] Home button clicked, navigating to /'); navigate('/'); }} aria-label="Home">
              <GfIcon name="home" size={20} />
            </button>
          )}
        </nav>

        <div className="gf-topbar__center">
          <span className="gf-topbar__appname">
            {isHome ? 'GFcode' : (app?.name || '')}
          </span>
        </div>

        <div className="gf-topbar__right">
          <button
            className="gf-topbar__settings"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            <GfIcon name="gear" size={18} />
          </button>
          <div className="gf-theme-indicator" style={{ background: activeTheme?.colors?.accent }} title={activeTheme?.name} />
        </div>
      </header>

      <main id="main-content" className="gf-shell__content">
        {children}
      </main>

      <InstallPrompt />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />

      <div aria-live="polite" aria-atomic="true" className="gf-sr-only">
        {themeKey === 'analog' ? 'Theme: Analog' :
         themeKey === 'spectrum' ? 'Theme: Spectrum' :
         themeKey === 'daylight' ? 'Theme: Daylight' :
         themeKey === 'forest' ? 'Theme: Forest' :
         themeKey === 'retro' ? 'Theme: Retro' : ''}
      </div>
    </div>
  )
}
