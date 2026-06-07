import { GfIcon } from '../iconSystem'
import { GfSegmentedControl } from './SegmentedControl'
import { GfBadge } from './Badge'
import './AppHeader.css'

interface Segment {
  value: string
  label: string
}

interface AppHeaderProps {
  title: string
  badge?: string
  count?: number
  countLabel?: string
  gradient?: string
  segments?: Segment[]
  segmentValue?: string
  onSegmentChange?: (value: string) => void
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export function AppHeader({
  title,
  badge,
  count,
  countLabel = 'items',
  gradient,
  segments,
  segmentValue,
  onSegmentChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: AppHeaderProps) {
  return (
    <div className="gf-app-header">
      <div className="gf-app-header__top">
        <h1
          className="gf-app-header__title"
          style={gradient ? { background: gradient, WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const } : undefined}
        >
          {title}
        </h1>
        <div className="gf-app-header__meta">
          {badge && <GfBadge variant="listeners">{badge}</GfBadge>}
          {count !== undefined && <span className="gf-app-header__count">{count} {countLabel}</span>}
        </div>
      </div>
      <div className="gf-app-header__filters">
        {segments && (
          <GfSegmentedControl segments={segments} value={segmentValue} onChange={onSegmentChange} />
        )}
        <div className="gf-app-header__search">
          <GfIcon name="search" size={14} />
          <input
            className="gf-app-header__search-input"
            type="text"
            placeholder={searchPlaceholder || 'Search...'}
            aria-label={searchPlaceholder || 'Search'}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
