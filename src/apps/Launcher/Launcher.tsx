import { useState, useMemo, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { apps, AppDef, AppCategory } from '../../framework/appRegistry'
import { useBadges } from '../../framework/AppBadgeContext'
import { WidgetGrid } from '../../framework/components/WidgetGrid'
import {
  IconHeadphones, IconRadio, IconGrid, IconChecklist,
  IconBird, IconRss, IconGlobe,
  IconGamepad, IconDocument, IconWeather,
  IconSnake, IconWave,
} from './icons'
import './Launcher.css'

function openInPopup(app: AppDef) {
  const base = import.meta.env.BASE_URL.slice(0, -1)
  const url = `${window.location.origin}${base}${app.path}?popup=1`
  window.open(url, app.id, 'width=800,height=650,menubar=no,toolbar=no,location=no,status=no')
}

const icons: Record<string, () => React.ReactNode> = {
  youtubelofi: IconHeadphones,
  somafm: IconRadio,
  game2048: IconGrid,
  todo: IconChecklist,

  flappybird: IconBird,
  rssreader: IconRss,
  radiobrowser: IconGlobe,
  emulator: IconGamepad,
  markdownnotes: IconDocument,
  weather: IconWeather,
  snake: IconSnake,
  moodist: IconWave,
}

const categoryOrder: AppCategory[] = ['music', 'games', 'productivity', 'utilities']

const categoryLabels: Record<AppCategory, { label: string; icon: string }> = {
  music: { label: 'Music', icon: '♪' },
  games: { label: 'Games', icon: '◆' },
  productivity: { label: 'Productivity', icon: '✓' },
  utilities: { label: 'Utilities', icon: '○' },
}

function AppCard({ app, index }: { app: AppDef; index: number }) {
  const navigate = useNavigate()
  const Icon = icons[app.id]
  const badges = useBadges()
  const badge = badges[app.id]

  return (
    <div
      className="gf-launcher__card"
      style={{
        '--card-color': app.color,
        '--card-gradient': app.gradient,
        '--card-index': index,
      } as CSSProperties}
      onClick={() => navigate(app.path)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${app.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(app.path) } }}
    >
      <div className="gf-launcher__card-header" style={{ background: app.gradient }}>
        <div className="gf-launcher__card-icon">
          {Icon ? <Icon /> : null}
        </div>
        {badge !== undefined && (
          <span className="gf-launcher__card-badge-count">{badge}</span>
        )}
        <button
          className="gf-launcher__card-popup-btn"
          onClick={(e) => { e.stopPropagation(); openInPopup(app) }}
          title="Open in popup window"
          aria-label="Open in popup window"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" fill="none" />
            <path d="M5 1.5V1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-.5" fill="none" />
            <path d="M1.5 5.5v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1z" fill="none" />
          </svg>
        </button>
      </div>

      <div className="gf-launcher__card-body">
        <span className="gf-launcher__card-badge" style={{ color: app.color }}>
          {categoryLabels[app.category].icon} {categoryLabels[app.category].label}
        </span>
        <h3 className="gf-launcher__card-title">{app.name}</h3>
        <p className="gf-launcher__card-desc">{app.description}</p>
        <span className="gf-launcher__card-action">
          Launch
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </span>
      </div>
    </div>
  )
}

export function Launcher() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return apps
    const q = query.toLowerCase()
    return apps.filter(
      a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    )
  }, [query])

  const grouped = useMemo(() => {
    const map: Record<AppCategory, AppDef[]> = { music: [], games: [], productivity: [], utilities: [] }
    for (const app of filtered) {
      if (map[app.category]) map[app.category].push(app)
    }
    return map
  }, [filtered])

  const hasResults = filtered.length > 0
  let cardIndex = 0

  return (
    <div className="gf-launcher">
      <h1 className="gf-sr-only">GFcode</h1>
      <div className="gf-launcher__search">
        <svg className="gf-launcher__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M12 12l4 4" />
        </svg>
        <input
          className="gf-launcher__search-input"
          type="text"
          placeholder="Search apps..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search apps"
        />
        {query && (
          <button
            className="gf-launcher__search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {!hasResults && (
        <div className="gf-launcher__empty">
          <p>No apps match "{query}"</p>
        </div>
      )}

      {!query && <WidgetGrid />}

      {query && <div className="gf-launcher__search-divider" />}

      {categoryOrder.map(cat => {
        const items = grouped[cat]
        if (items.length === 0) return null
        const { label, icon } = categoryLabels[cat]
        const sectionCards = items.map(app => {
          const idx = cardIndex++
          return <AppCard key={app.id} app={app} index={idx} />
        })

        return (
          <section key={cat} className="gf-launcher__section">
            <h2 className="gf-launcher__section-title">{icon} {label}</h2>
            <div className="gf-launcher__grid">
              {sectionCards}
            </div>
          </section>
        )
      })}
    </div>
  )
}
