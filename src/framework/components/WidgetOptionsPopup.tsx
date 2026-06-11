import { useRef, useEffect, useCallback } from 'react'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return []
    const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selectors))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
  }, [])

  useEffect(() => {
    if (!open) return

    prevFocusRef.current = document.activeElement as HTMLElement

    const timer = setTimeout(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) focusable[0].focus()
    }, 50)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      prevFocusRef.current?.focus()
    }
  }, [open, onClose, getFocusableElements])

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
      <div className="gf-widget-options-modal" ref={modalRef}>
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

function OptionRow({ option, value, onChange }: { option: WidgetOption; value: unknown; onChange: (val: string | boolean | number) => void }) {
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
      {option.type === 'number' && (
        <input
          id={id}
          className="gf-widget-options-row__number"
          type="number"
          value={Number(value ?? option.default)}
          min={option.min}
          max={option.max}
          step={option.step}
          onChange={e => onChange(Number(e.target.value))}
        />
      )}
      {option.type === 'range' && (
        <div className="gf-widget-options-row__range-wrap">
          <input
            id={id}
            className="gf-widget-options-row__range"
            type="range"
            value={Number(value ?? option.default)}
            min={option.min ?? 0}
            max={option.max ?? 100}
            step={option.step ?? 1}
            onChange={e => onChange(Number(e.target.value))}
          />
          <span className="gf-widget-options-row__range-value">{Number(value ?? option.default)}</span>
        </div>
      )}
      {option.type === 'color' && (
        <input
          id={id}
          className="gf-widget-options-row__color"
          type="color"
          value={String(value ?? option.default)}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
