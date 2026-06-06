import { useState, useCallback } from 'react'
import { useNoiseGenerator } from '../hooks/useBinauralBeat'

type NoiseColor = 'white' | 'pink' | 'brown'

const NOISE_LABELS: Record<NoiseColor, string> = {
  white: 'White Noise',
  pink: 'Pink Noise',
  brown: 'Brown Noise',
}

export function NoisePanel() {
  const [active, setActive] = useState(false)
  const [color, setColor] = useState<NoiseColor>('white')
  const [volume, setVolume] = useState(0.3)
  const noise = useNoiseGenerator()

  const toggle = useCallback(() => {
    if (active) {
      noise.stopNoise()
      setActive(false)
    } else {
      noise.startNoise(color, volume)
      setActive(true)
    }
  }, [active, color, volume, noise])

  const handleColorChange = useCallback((val: NoiseColor) => {
    setColor(val)
    if (active) {
      noise.startNoise(val, volume)
    }
  }, [active, volume, noise])

  const handleVolChange = useCallback((val: number) => {
    setVolume(val)
    if (active) {
      noise.setNoiseVolume(val)
    }
  }, [active, noise])

  return (
    <div className="gf-moodist__panel">
      <div className="gf-moodist__panel-title">Noise Generator</div>

      <div className="gf-moodist__row">
        <select
          className="gf-moodist__select"
          value={color}
          onChange={e => handleColorChange(e.target.value as NoiseColor)}
          style={{ flex: 1 }}
        >
          {Object.entries(NOISE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="gf-moodist__row">
        <span style={{ fontSize: 12, color: 'var(--gf-text-muted)' }}>Volume</span>
        <input
          className="gf-moodist__sound-vol"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          style={{ flex: 1 }}
          onChange={e => handleVolChange(Number(e.target.value))}
          aria-label="Noise volume"
        />
      </div>

      <button
        className={`gf-moodist__btn ${active ? 'gf-moodist__btn--secondary' : ''}`}
        onClick={toggle}
      >
        {active ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}
