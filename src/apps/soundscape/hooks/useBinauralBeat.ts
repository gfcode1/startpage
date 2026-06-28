import { useRef, useCallback, useEffect } from 'react'
import { ensureAudioContext } from '../lib/audio-context'

type NoiseColor = 'white' | 'pink' | 'brown'
type BinauralFreq = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

const BINAURAL_MAP: Record<BinauralFreq, number> = {
  delta: 3, theta: 6, alpha: 10, beta: 20, gamma: 40,
}

const CROSSFADE_SAMPLES = 512

export function useNoiseGenerator() {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const stopNoise = useCallback(() => {
    try { sourceRef.current?.stop() } catch { /* ignore */ }
    sourceRef.current?.disconnect(); sourceRef.current = null
    gainRef.current?.disconnect(); gainRef.current = null
  }, [])

  const startNoise = useCallback(async (color: NoiseColor, volume: number) => {
    stopNoise()
    const ctx = await ensureAudioContext()

    const sr = ctx.sampleRate
    const len = sr * 30
    const buffer = ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)

    if (color === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    } else if (color === 'brown') {
      let lastOut = 0
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1
        const val = (lastOut + 0.02 * white) * 0.5
        data[i] = val
        lastOut = val
      }
    } else {
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }

    for (let i = 0; i < CROSSFADE_SAMPLES; i++) {
      const t = i / CROSSFADE_SAMPLES
      const di = data[i]; if (di !== undefined) data[i] = di * t
      const dli = data[len - 1 - i]; if (dli !== undefined) data[len - 1 - i] = dli * t
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer; source.loop = true
    const gain = ctx.createGain(); gain.gain.value = volume
    source.connect(gain); gain.connect(ctx.destination)
    source.start()
    sourceRef.current = source; gainRef.current = gain
  }, [stopNoise])

  const setNoiseVolume = useCallback((vol: number) => {
    if (gainRef.current) gainRef.current.gain.value = vol
  }, [])

  useEffect(() => {
    return () => { stopNoise() }
  }, [stopNoise])

  return { startNoise, stopNoise, setNoiseVolume }
}

export function useBinauralBeat() {
  const oscLeft = useRef<OscillatorNode | null>(null)
  const oscRight = useRef<OscillatorNode | null>(null)
  const gainLeft = useRef<GainNode | null>(null)
  const gainRight = useRef<GainNode | null>(null)
  const gainOut = useRef<GainNode | null>(null)
  const freqRef = useRef<BinauralFreq>('alpha')
  const carrierRef = useRef(200)

  const stop = useCallback(() => {
    try { oscLeft.current?.stop() } catch { /* ignore */ }
    try { oscRight.current?.stop() } catch { /* ignore */ }
    ;[oscLeft, oscRight, gainLeft, gainRight, gainOut].forEach((r) => r.current?.disconnect())
    ;[oscLeft, oscRight, gainLeft, gainRight, gainOut].forEach((r) => { r.current = null })
  }, [])

  const setFrequency = useCallback((freq: BinauralFreq, carrierHz: number) => {
    freqRef.current = freq
    carrierRef.current = carrierHz
    const beatHz = BINAURAL_MAP[freq]
    if (oscLeft.current) oscLeft.current.frequency.value = carrierHz
    if (oscRight.current) oscRight.current.frequency.value = carrierHz + beatHz
  }, [])

  const setCarrier = useCallback((carrierHz: number) => {
    carrierRef.current = carrierHz
    const beatHz = BINAURAL_MAP[freqRef.current]
    if (oscLeft.current) oscLeft.current.frequency.value = carrierHz
    if (oscRight.current) oscRight.current.frequency.value = carrierHz + beatHz
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (gainOut.current) gainOut.current.gain.value = vol * 0.3
  }, [])

  const start = useCallback(async (freq: BinauralFreq, carrierHz: number, volume: number) => {
    stop()
    const ctx = await ensureAudioContext()

    freqRef.current = freq
    carrierRef.current = carrierHz
    const beatHz = BINAURAL_MAP[freq]
    const gL = ctx.createGain(); gL.gain.value = 1
    const gR = ctx.createGain(); gR.gain.value = 1
    const merger = ctx.createChannelMerger(2)
    gL.connect(merger, 0, 0); gR.connect(merger, 0, 1)
    const out = ctx.createGain(); out.gain.value = volume * 0.3
    merger.connect(out); out.connect(ctx.destination)

    const oL = ctx.createOscillator(); oL.type = 'sine'; oL.frequency.value = carrierHz
    const oR = ctx.createOscillator(); oR.type = 'sine'; oR.frequency.value = carrierHz + beatHz
    oL.connect(gL); oR.connect(gR)
    oL.start(); oR.start()

    oscLeft.current = oL; oscRight.current = oR
    gainLeft.current = gL; gainRight.current = gR; gainOut.current = out
  }, [stop])

  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { start, stop, setVolume, setFrequency, setCarrier }
}
