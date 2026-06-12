import { useState, useCallback } from 'react'
import { useBinauralBeat } from '../hooks/useBinauralBeat'
import { GfButton } from '../../../framework/components/Button'
import { GfSlider } from '../../../framework/components/Slider'

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
          aria-label="Binaural beat frequency"
        >
          {Object.entries(FREQ_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="gf-moodist__row">
        <span className="gf-moodist__label">Carrier: {carrier} Hz</span>
        <GfSlider
          value={carrier}
          min={100}
          max={400}
          step={10}
          aria-label="Carrier frequency"
          onChange={v => {
            setCarrier(v)
            if (active) beat.start(frequency, v, volume)
          }}
        />
      </div>

      <div className="gf-moodist__row">
        <span className="gf-moodist__label">Volume</span>
        <GfSlider
          value={volume}
          min={0}
          max={1}
          step={0.01}
          aria-label="Binaural volume"
          onChange={handleVolChange}
        />
      </div>

      <GfButton
        variant={active ? 'secondary' : 'primary'}
        size="sm"
        onClick={toggle}
      >
        {active ? 'Stop' : 'Start'}
      </GfButton>
    </div>
  )
}
