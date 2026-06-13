import { ReactNode, useState, useEffect } from 'react'
import { useGfTheme } from './ThemeProvider'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAppByPath } from './appRegistry'
import { useScrollToTop } from './hooks/useScrollToTop'
import { TopbarProvider, useTopbar } from './TopbarContext'
import { TopbarSearch } from './components/TopbarSearch'
import { GfBottomSheet } from './components/BottomSheet'
import { GfIcon } from './iconSystem'
import { SettingsModal } from './components/SettingsModal'
import { InstallPrompt } from './components/InstallPrompt'
import { useWindowManager } from './WindowManager'
import './AppShell.css'

const MOBILE_BREAKPOINT = '(max-width: 639px)'

function TopbarInner({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { activeTheme } = useGfTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const app = getAppByPath(location.pathname)
  const isPopup = window.opener !== null || new URLSearchParams(window.location.search).has('popup')
  const { actions, search, customSearch } = useTopbar()
  const [showOverflow, setShowOverflow] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_BREAKPOINT).matches)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const visibleActions = isMobile ? actions.filter(a => a.variant === 'primary').slice(0, 2) : actions
  const hasOverflow = isMobile && actions.length > visibleActions.length

  const appGradient = !isHome && app?.gradient

  return (
    <header className="gf-topbar">
      <nav className="gf-topbar__left" aria-label="Navigation">
        {isPopup ? (
          <button className="gf-topbar__close" onClick={() => window.close()} aria-label="Close">
            <GfIcon name="close" size={16} />
          </button>
        ) : !isHome && (
          <button className="gf-topbar__home" onClick={() => { navigate('/'); }} aria-label="Home">
            <GfIcon name="home" size={20} />
          </button>
        )}
      </nav>

      <div className="gf-topbar__center">
        <span
          className="gf-topbar__appname"
          style={appGradient ? {
            background: appGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } : undefined}
        >
          {isHome ? 'GFcode' : (app?.name || '')}
        </span>
      </div>

      <div className="gf-topbar__right">
        {customSearch ? customSearch : (
          <>
            {visibleActions.map(action => (
              <button
                key={action.id}
                className={`gf-topbar__action ${action.variant === 'primary' ? 'gf-topbar__action--primary' : ''}`}
                onClick={action.onClick}
                aria-label={action.label}
                title={action.label}
              >
                <GfIcon name={action.icon} size={16} />
              </button>
            ))}
            {hasOverflow && (
              <button
                className="gf-topbar__action"
                onClick={() => setShowOverflow(true)}
                aria-label="More actions"
                title="More actions"
              >
                <GfIcon name="menu" size={16} />
              </button>
            )}
            {search && <TopbarSearch search={search} />}
          </>
        )}
        <button
          className="gf-topbar__settings"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <GfIcon name="gear" size={18} />
        </button>
        <div className="gf-theme-indicator" style={{ background: activeTheme?.colors?.accent }} title={activeTheme?.name} />
      </div>

      <GfBottomSheet open={showOverflow} onClose={() => setShowOverflow(false)} title="Actions">
        <div className="gf-topbar__overflow-actions">
          {actions.map(action => (
            <button
              key={action.id}
              className="gf-topbar__overflow-btn"
              onClick={() => { action.onClick(); setShowOverflow(false) }}
            >
              <GfIcon name={action.icon} size={16} />
              {action.label}
            </button>
          ))}
        </div>
      </GfBottomSheet>
    </header>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  useScrollToTop()
  const { themeKey } = useGfTheme()
  const [showSettings, setShowSettings] = useState(false)
  const { windows } = useWindowManager()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const hasWindows = windows.length > 0
  const hideTopbar = isHome && hasWindows

  return (
    <TopbarProvider>
      <div className={`gf-shell ${hideTopbar ? 'gf-shell--desktop' : ''}`}>
        <a href="#main-content" className="gf-skip-link">
          Skip to content
        </a>

        <div className={`gf-topbar-wrapper ${hideTopbar ? 'gf-topbar-wrapper--hidden' : ''}`}>
          <TopbarInner onOpenSettings={() => setShowSettings(true)} />
        </div>

        <main id="main-content" className={`gf-shell__content ${hideTopbar ? 'gf-shell__content--desktop' : ''}`}>
          {children}
        </main>

        <InstallPrompt />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />

        <div aria-live="polite" aria-atomic="true" className="gf-sr-only">
          Theme: {themeKey === 'light' ? 'Light' : 'Dark'}
        </div>
      </div>
    </TopbarProvider>
  )
}
