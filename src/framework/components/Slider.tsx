import './Slider.css'

interface SliderProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  [key: string]: unknown
}

export function GfSlider({ value = 0, onChange, min = 0, max = 1, step = 0.01, className = '', ...props }: SliderProps) {
  return (
    <div className={`gf-slider ${className}`} {...props}>
      <input
        type="range"
        className="gf-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
      />
      <div className="gf-slider__track">
        <div className="gf-slider__fill" style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
      </div>
      <div className="gf-slider__thumb" style={{ left: `${((value - min) / (max - min)) * 100}%` }} />
    </div>
  )
}
