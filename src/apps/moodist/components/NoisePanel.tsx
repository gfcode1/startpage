import { useState, useCallback } from 'react'
import { Text, SegmentedControl, Slider, Button, Stack } from '@mantine/core'
import { useNoiseGenerator } from '../hooks/useBinauralBeat'

type NoiseColor = 'white' | 'pink' | 'brown'

const NOISE_OPTIONS: { label: string; value: NoiseColor }[] = [
  { label: 'White', value: 'white' },
  { label: 'Pink', value: 'pink' },
  { label: 'Brown', value: 'brown' },
]

export function NoisePanel() {
  const [active, setActive] = useState(false)
  const [color, setColor] = useState<NoiseColor>('white')
  const [volume, setVolume] = useState(0.5)
  const noise = useNoiseGenerator()

  const toggle = useCallback(() => {
    if (active) { noise.stopNoise(); setActive(false) }
    else { noise.startNoise(color, volume); setActive(true) }
  }, [active, color, volume, noise])

  return (
    <div style={{ padding: 16, marginBottom: 16, border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
      <Text fw={600} mb="sm">Noise Generator</Text>
      <Stack gap="sm">
        <SegmentedControl value={color} onChange={(v) => { const c = NOISE_OPTIONS.find((o) => o.value === v); if (c) { setColor(c.value); if (active) noise.startNoise(c.value, volume) } }} data={NOISE_OPTIONS} size="xs" />
        <div>
          <Text size="xs">Volume</Text>
          <Slider value={volume} onChange={(v) => { setVolume(v); if (active) noise.setNoiseVolume(v) }} min={0} max={1} step={0.01} size="xs" />
        </div>
        <Button variant={active ? 'light' : 'filled'} size="sm" onClick={toggle}>
          {active ? 'Stop' : 'Start'}
        </Button>
      </Stack>
    </div>
  )
}
