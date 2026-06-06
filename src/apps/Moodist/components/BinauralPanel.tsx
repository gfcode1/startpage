import { useState, useCallback } from 'react'
import { useBinauralBeat } from '../hooks/useBinauralBeat'

type BinauralFreq = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

const FREQ_LABELS: Record<BinauralFreq, string> = {
  delta: 'Delta (1-4 Hz) — Deep Sleep',
  theta: 'Theta (4-8 Hz) — Meditation',
  alpha: 'Alpha (8-14 Hz) — Relaxation',
  beta: 'Beta (14-30 Hz) — Focus',
  gamma: 'Gamma (30-100 Hz) — Cognition',
}

export function BinauralPanel() {
  const [active, setActive] = useState(false)
  const [frequency, setFrequency] = useState<BinauralFreq>('alpha')
  const [carrier, setCarrier] = useState(200)
  const [volume, setVolume] = useState(0.5)
  const beat = useBinauralBeat()

  const toggle = useCallback(() => {
    if (active) {
      beat.stop()
      setActive(false)
    } else {
      beat.start(frequency, carrier, volume)
      setActive(true)
    }
  }, [active, frequency, carrier, volume, beat])

  const handleFreqChange = useCallback((val: BinauralFreq) => {
    setFrequency(val)
    if (active) {
      beat.start(val, carrier, volume)
    }
  }, [active, carrier, volume, beat])

  const handleVolChange = useCallback((val: number) => {
    setVolume(val)
    if (active) {
      beat.setVolume(val)
    }
  }, [active, beat])

  return (
    <div className="gf-moodist__panel">
      <div className="gf-moodist__panel-title">Binaural Beats</div>

      <div className="gf-moodist__row">
        <select
          className="gf-moodist__select"
          value={frequency}
          onChange={e => handleFreqChange(e.target.value as BinauralFreq)}
          style={{ flex: 1 }}
        >
          {Object.entries(FREQ_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="gf-moodist__row">
        <span style={{ fontSize: 12, color: 'var(--gf-text-muted)' }}>Carrier: {carrier} Hz</span>
        <input
          className="gf-moodist__sound-vol"
          type="range"
          min={100}
          max={400}
          step={10}
          value={carrier}
          style={{ flex: 1 }}
          onChange={e => {
            const v = Number(e.target.value)
            setCarrier(v)
            if (active) beat.start(frequency, v, volume)
          }}
          aria-label="Carrier frequency"
        />
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
          aria-label="Binaural volume"
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
