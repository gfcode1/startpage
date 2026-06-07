import { ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import { useGfTheme } from './ThemeProvider'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAppByPath } from './appRegistry'
import { useScrollToTop } from './hooks/useScrollToTop'
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          ) : !isHome && (
            <button className="gf-topbar__home" onClick={() => { console.log('[DEBUG] Home button clicked, navigating to /'); navigate('/'); }} aria-label="Home">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M16 19H4a1 1 0 0 1-1-1V8l7-6 7 6v10a1 1 0 0 1-1 1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M8 19v-6h4v6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 1.5V4M9 14v2.5M1.5 9H4M14 9h2.5M3.2 3.2l2 2M12.8 12.8l2 2M3.2 14.8l2-2M12.8 5.2l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
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
