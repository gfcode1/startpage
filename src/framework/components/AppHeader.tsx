import { GfSegmentedControl } from './SegmentedControl'
import { GfBadge } from './Badge'
import './AppHeader.css'

interface Segment {
  value: string
  label: string
}

interface AppHeaderProps {
  badge?: string
  count?: number
  countLabel?: string
  segments?: Segment[]
  segmentValue?: string
  onSegmentChange?: (value: string) => void
}

export function AppHeader({
  badge,
  count,
  countLabel = 'items',
  segments,
  segmentValue,
  onSegmentChange,
}: AppHeaderProps) {
  return (
    <div className="gf-app-header">
      {(badge || count !== undefined) && (
        <div className="gf-app-header__meta">
          {badge && <GfBadge variant="listeners">{badge}</GfBadge>}
          {count !== undefined && <span className="gf-app-header__count">{count} {countLabel}</span>}
        </div>
      )}
      {segments && (
        <div className="gf-app-header__filters">
          <GfSegmentedControl segments={segments} value={segmentValue} onChange={onSegmentChange} />
        </div>
      )}
    </div>
  )
}
