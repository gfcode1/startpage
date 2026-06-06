import './SegmentedControl.css'

interface Segment {
  value: string
  label: string
}

interface SegmentedControlProps {
  segments?: Segment[]
  value?: string
  onChange?: (value: string) => void
  className?: string
  [key: string]: unknown
}

export function GfSegmentedControl({ segments = [], value, onChange, className = '', ...props }: SegmentedControlProps) {
  return (
    <div className={`gf-segmented ${className}`} role="radiogroup" {...props}>
      {segments.map(seg => (
        <button
          key={seg.value}
          className={`gf-segmented__item ${value === seg.value ? 'gf-segmented__item--active' : ''}`}
          role="radio"
          aria-checked={value === seg.value}
          onClick={() => onChange?.(seg.value)}
        >
          {seg.label}
        </button>
      ))}
    </div>
  )
}
