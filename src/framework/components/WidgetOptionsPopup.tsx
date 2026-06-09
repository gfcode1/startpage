import { useRef, useEffect } from 'react'
import { GfIcon } from '../iconSystem'
import { getWidgetById, type WidgetOption } from '../widgetRegistry'
import { useWidgetOptions } from '../WidgetOptionsContext'
import './WidgetOptionsPopup.css'

interface WidgetOptionsPopupProps {
  widgetId: string
  open: boolean
  onClose: () => void
}

export function WidgetOptionsPopup({ widgetId, open, onClose }: WidgetOptionsPopupProps) {
  const def = getWidgetById(widgetId)
  const { options, setOption } = useWidgetOptions(widgetId)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !def?.options) return null

  return (
    <div
      className="gf-widget-options-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${def.name} options`}
    >
      <div className="gf-widget-options-modal">
        <div className="gf-widget-options-modal__header">
          <h2 className="gf-widget-options-modal__title">
            <GfIcon name="settings" size={16} />
            {def.name} Options
          </h2>
          <button className="gf-widget-options-modal__close" onClick={onClose} aria-label="Close">
            <GfIcon name="close" size={18} />
          </button>
        </div>

        <div className="gf-widget-options-modal__body">
          {def.options.map(opt => (
            <OptionRow
              key={opt.key}
              option={opt}
              value={options[opt.key]}
              onChange={(val) => setOption(opt.key, val)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function OptionRow({ option, value, onChange }: { option: WidgetOption; value: unknown; onChange: (val: string | boolean) => void }) {
  const id = `widget-opt-${option.key}`
  return (
    <div className="gf-widget-options-row">
      <label className="gf-widget-options-row__label" htmlFor={id}>{option.label}</label>
      {option.type === 'select' && (
        <select
          id={id}
          className="gf-widget-options-row__select"
          value={String(value ?? option.default)}
          onChange={e => onChange(e.target.value)}
        >
          {option.options?.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {option.type === 'toggle' && (
        <button
          id={id}
          className={`gf-widget-options-row__toggle${value ? ' gf-widget-options-row__toggle--on' : ''}`}
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={!!value}
        >
          <span className="gf-widget-options-row__toggle-knob" />
        </button>
      )}
      {option.type === 'text' && (
        <input
          id={id}
          className="gf-widget-options-row__text"
          type="text"
          value={String(value ?? option.default)}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
