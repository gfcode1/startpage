import { useState, useMemo, CSSProperties } from 'react'
import { Icon } from '@iconify/react'
import { GfIcon, IconName } from '../../framework/iconSystem'
import { apps, AppDef, AppCategory } from '../../framework/appRegistry'
import { useBadges } from '../../framework/AppBadgeContext'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { WidgetGrid } from '../../framework/components/WidgetGrid'
import { GfSegmentedControl } from '../../framework/components/SegmentedControl'
import { useWindowManager } from '../../framework/WindowManager'
import './Launcher.css'

function openInPopup(app: AppDef) {
  const base = import.meta.env.BASE_URL.slice(0, -1)
  const url = `${window.location.origin}${base}${app.path}?popup=1`
  window.open(url, app.id, 'width=800,height=650,menubar=no,toolbar=no,location=no,status=no')
}

const categoryOrder: AppCategory[] = ['music', 'games', 'productivity', 'utilities']

const categoryLabels: Record<AppCategory, string> = {
  music: 'Music',
  games: 'Games',
  productivity: 'Productivity',
  utilities: 'Utilities',
}

const categoryIcons: Record<AppCategory, IconName> = {
  music: 'music',
  games: 'games',
  productivity: 'productivity',
  utilities: 'utilities',
}

function AppCard({ app, index, isFavorite, onToggleFavorite }: { app: AppDef; index: number; isFavorite: boolean; onToggleFavorite: (id: string) => void }) {
  const { openWindow, isOpen, focusWindow } = useWindowManager()
  const badges = useBadges()
  const badge = badges[app.id]
  const alreadyOpen = isOpen(app.id)

  const handleOpen = () => {
    if (alreadyOpen) {
      focusWindow(app.id)
    } else {
      openWindow(app.id)
    }
  }

  return (
    <div
      className={`gf-launcher__card ${alreadyOpen ? 'gf-launcher__card--open' : ''}`}
      style={{
        '--card-color': app.color,
        '--card-gradient': app.gradient,
        '--card-index': index,
      } as CSSProperties}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label={`Open ${app.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen() } }}
    >
      <div className="gf-launcher__card-inner">
        {/* Front — gradient + icon + name */}
        <div className="gf-launcher__card-front" style={{ background: app.gradient }}>
          <div className="gf-launcher__card-icon">
            <Icon icon={app.icon} width={24} height={24} />
          </div>
          <h3 className="gf-launcher__card-front-title">{app.name}</h3>
          {badge !== undefined && (
            <span className="gf-launcher__card-badge-count">{badge}</span>
          )}
        </div>

        {/* Back — description + actions */}
        <div className="gf-launcher__card-back">
          <span className="gf-launcher__card-badge" style={{ color: app.color }}>
            <GfIcon name={categoryIcons[app.category]} size={10} /> {categoryLabels[app.category]}
          </span>
          <p className="gf-launcher__card-desc">{app.description}</p>
          <div className="gf-launcher__card-back-footer">
            <span className="gf-launcher__card-action">
              Launch
              <GfIcon name="chevron-right" size={16} />
            </span>
            <div className="gf-launcher__card-back-actions">
              <button
                className={`gf-launcher__card-fav${isFavorite ? ' gf-launcher__card-fav--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(app.id) }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <GfIcon name={isFavorite ? 'star' : 'star-outline'} size={14} />
              </button>
              <button
                className="gf-launcher__card-popup-btn"
                onClick={(e) => { e.stopPropagation(); openInPopup(app) }}
                title="Open in popup window"
                aria-label="Open in popup window"
              >
                <GfIcon name="popup" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type Tab = 'widgets' | 'apps'

const TAB_SEGMENTS = [
  { value: 'widgets', label: 'Widget' },
  { value: 'apps', label: 'Apps' },
]

export function Launcher() {
  const [tab, setTab] = useState<Tab>('widgets')
  const [query, setQuery] = useState('')
  const [favoriteApps, setFavoriteApps] = useAppStorage<string[]>('_framework', 'favoriteApps', [])

  function toggleFavorite(id: string) {
    setFavoriteApps(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

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

      <div className="gf-launcher__tabs">
        <GfSegmentedControl
          segments={TAB_SEGMENTS}
          value={tab}
          onChange={v => setTab(v as Tab)}
        />
      </div>

      {tab === 'widgets' ? (
        <WidgetGrid />
      ) : (
        <>
          <div className="gf-launcher__search">
            <GfIcon name="search" size={18} className="gf-launcher__search-icon" />
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
                <GfIcon name="close" size={16} />
              </button>
            )}
          </div>

          {query && <div className="gf-launcher__search-divider" />}

          {!hasResults && (
            <div className="gf-launcher__empty">
              <p>No apps match "{query}"</p>
            </div>
          )}

          {categoryOrder.map(cat => {
            const items = grouped[cat]
            if (items.length === 0) return null
            const sectionCards = items.map(app => {
              const idx = cardIndex++
              return (
                <AppCard
                  key={app.id}
                  app={app}
                  index={idx}
                  isFavorite={favoriteApps.includes(app.id)}
                  onToggleFavorite={toggleFavorite}
                />
              )
            })

            return (
              <section key={cat} className="gf-launcher__section">
                <h2 className="gf-launcher__section-title"><GfIcon name={categoryIcons[cat]} size={14} /> {categoryLabels[cat]}</h2>
                <div className="gf-launcher__grid">
                  {sectionCards}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
