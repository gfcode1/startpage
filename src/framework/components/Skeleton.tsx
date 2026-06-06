import './Skeleton.css'

interface SkeletonGridProps {
  count?: number
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="gf-skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="gf-skeleton-card">
          <div className="gf-skeleton-card__top">
            <div className="gf-skeleton-box" style={{ width: 80, height: 80, borderRadius: 8 }} />
            <div className="gf-skeleton-card__info">
              <div className="gf-skeleton-line" style={{ width: '70%' }} />
              <div className="gf-skeleton-line" style={{ width: '50%' }} />
            </div>
          </div>
          <div className="gf-skeleton-line" style={{ width: '40%', marginTop: 8 }} />
          <div className="gf-skeleton-card__actions">
            <div className="gf-skeleton-box" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className="gf-skeleton-box" style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
