import { useRef, useCallback, useEffect } from 'react'

type NoiseColor = 'white' | 'pink' | 'brown'
type BinauralFreq = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

const BINAURAL_MAP: Record<BinauralFreq, number> = {
  delta: 3,
  theta: 6,
  alpha: 10,
  beta: 20,
  gamma: 40,
}

function getAudioCtx(ctxRef: React.MutableRefObject<AudioContext | null>) {
  if (!ctxRef.current || ctxRef.current.state === 'closed') {
    ctxRef.current = new AudioContext()
  }
  return ctxRef.current
}

export function useNoiseGenerator() {
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const isPlaying = useRef(false)

  const stopNoise = useCallback(() => {
    try { sourceRef.current?.stop() } catch { /* ignore */ }
    sourceRef.current?.disconnect()
    sourceRef.current = null
    gainRef.current?.disconnect()
    gainRef.current = null
    isPlaying.current = false
  }, [])

  const startNoise = useCallback((color: NoiseColor, volume: number) => {
    stopNoise()
    const ctx = getAudioCtx(ctxRef)
    if (ctx.state === 'suspended') ctx.resume()

    const sr = ctx.sampleRate
    const len = sr * 4
    const buffer = ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      if (color === 'white') {
        data[i] = white
      } else if (color === 'pink') {
        data[i] = white * 0.5
      } else {
        data[i] = white * 0.3
      }
    }

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
        data[i] = (lastOut + 0.02 * white) * 0.5
        lastOut = data[i]
      }
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.value = volume

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    sourceRef.current = source
    gainRef.current = gain
    isPlaying.current = true
  }, [stopNoise])

  const setNoiseVolume = useCallback((vol: number) => {
    if (gainRef.current) {
      gainRef.current.gain.value = vol
    }
  }, [])

  useEffect(() => {
    const ctx = ctxRef.current
    return () => { stopNoise(); ctx?.close() }
  }, [stopNoise])

  return { startNoise, stopNoise, setNoiseVolume, isPlaying }
}

export function useBinauralBeat() {
  const ctxRef = useRef<AudioContext | null>(null)
  const oscLeft = useRef<OscillatorNode | null>(null)
  const oscRight = useRef<OscillatorNode | null>(null)
  const gainLeft = useRef<GainNode | null>(null)
  const gainRight = useRef<GainNode | null>(null)
  const gainOut = useRef<GainNode | null>(null)
  const isPlaying = useRef(false)

  const stop = useCallback(() => {
    try { oscLeft.current?.stop() } catch { /* ignore */ }
    try { oscRight.current?.stop() } catch { /* ignore */ }
    oscLeft.current?.disconnect()
    oscRight.current?.disconnect()
    gainLeft.current?.disconnect()
    gainRight.current?.disconnect()
    gainOut.current?.disconnect()
    oscLeft.current = null
    oscRight.current = null
    gainLeft.current = null
    gainRight.current = null
    gainOut.current = null
    isPlaying.current = false
  }, [])

  const start = useCallback((freq: BinauralFreq, carrierHz: number, volume: number) => {
    stop()
    const ctx = getAudioCtx(ctxRef)
    if (ctx.state === 'suspended') ctx.resume()

    const beatHz = BINAURAL_MAP[freq]
    const leftFreq = carrierHz
    const rightFreq = carrierHz + beatHz

    const gL = ctx.createGain()
    const gR = ctx.createGain()
    gL.gain.value = 1
    gR.gain.value = 1

    const merger = ctx.createChannelMerger(2)
    gL.connect(merger, 0, 0)
    gR.connect(merger, 0, 1)

    const out = ctx.createGain()
    out.gain.value = volume * 0.3
    merger.connect(out)
    out.connect(ctx.destination)

    const oL = ctx.createOscillator()
    oL.type = 'sine'
    oL.frequency.value = leftFreq
    oL.connect(gL)

    const oR = ctx.createOscillator()
    oR.type = 'sine'
    oR.frequency.value = rightFreq
    oR.connect(gR)

    oL.start()
    oR.start()

    oscLeft.current = oL
    oscRight.current = oR
    gainLeft.current = gL
    gainRight.current = gR
    gainOut.current = out
    isPlaying.current = true
  }, [stop])

  const setVolume = useCallback((vol: number) => {
    if (gainOut.current) {
      gainOut.current.gain.value = vol * 0.3
    }
  }, [])

  useEffect(() => {
    const ctx = ctxRef.current
    return () => { stop(); ctx?.close() }
  }, [stop])

  return { start, stop, setVolume, isPlaying }
}
