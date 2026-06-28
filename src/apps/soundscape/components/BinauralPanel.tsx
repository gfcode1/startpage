import { useState, useCallback } from 'react'
import { Text, Select, Slider, Button, Stack } from '@mantine/core'
import { useBinauralBeat } from '../hooks/useBinauralBeat'

type BinauralFreq = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

const FREQ_OPTIONS: { value: BinauralFreq; label: string }[] = [
  { value: 'delta', label: 'Delta (1-4 Hz) — Deep Sleep' },
  { value: 'theta', label: 'Theta (4-8 Hz) — Meditation' },
  { value: 'alpha', label: 'Alpha (8-14 Hz) — Relaxation' },
  { value: 'beta', label: 'Beta (14-30 Hz) — Focus' },
  { value: 'gamma', label: 'Gamma (30-100 Hz) — Cognition' },
]

export function BinauralPanel() {
  const [active, setActive] = useState(false)
  const [frequency, setFrequency] = useState<BinauralFreq>('alpha')
  const [carrier, setCarrier] = useState(200)
  const [volume, setVolume] = useState(0.5)
  const beat = useBinauralBeat()

  const toggle = useCallback(() => {
    if (active) { beat.stop(); setActive(false) }
    else { beat.start(frequency, carrier, volume); setActive(true) }
  }, [active, frequency, carrier, volume, beat])

  return (
    <Stack gap="sm">
      <Select
        value={frequency}
        onChange={(v) => {
          const f = FREQ_OPTIONS.find((o) => o.value === v)
          if (f) {
            setFrequency(f.value)
            if (active) beat.setFrequency(f.value, carrier)
          }
        }}
        data={FREQ_OPTIONS}
        size="sm"
      />
      <div>
        <Text size="xs">Carrier: {carrier} Hz</Text>
        <Slider value={carrier} onChange={(v) => { setCarrier(v); if (active) beat.setCarrier(v) }} min={100} max={400} step={10} size="xs" />
      </div>
      <div>
        <Text size="xs">Volume</Text>
        <Slider value={volume} onChange={(v) => { setVolume(v); beat.setVolume(v) }} min={0} max={1} step={0.01} size="xs" />
      </div>
      <Button variant={active ? 'light' : 'filled'} size="sm" onClick={toggle}>
        {active ? 'Stop' : 'Start'}
      </Button>
    </Stack>
  )
}
