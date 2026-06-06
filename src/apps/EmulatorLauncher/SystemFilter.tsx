import { SYSTEM_MAP, ALL_SYSTEMS, type SystemId } from './constants'

interface SystemFilterProps {
  selected: SystemId | null
  onChange: (system: SystemId | null) => void
}

export function SystemFilter({ selected, onChange }: SystemFilterProps) {
  return (
    <div className="gf-emu__filter">
      <button
        className={`gf-emu__filter-btn ${selected === null ? 'gf-emu__filter-btn--active' : ''}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {ALL_SYSTEMS.map(sys => {
        const meta = SYSTEM_MAP[sys]
        return (
          <button
            key={sys}
            className={`gf-emu__filter-btn ${selected === sys ? 'gf-emu__filter-btn--active' : ''}`}
            style={{ '--sys-color': meta.color } as React.CSSProperties}
            onClick={() => onChange(sys)}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
