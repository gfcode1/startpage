export interface TrackOptions {
  volume?: number
  pan?: number
  fadeIn?: number
  fadeOut?: number
  scheduleMode?: 'continuous' | 'periodic' | 'random'
  scheduleInterval?: number
  scheduleIntervalMin?: number
  scheduleIntervalMax?: number
  panModMode?: 'static' | 'sweep' | 'random'
  panSweepRate?: number
  panSpread?: number
}

export interface TrackInfo {
  id: string
  volume: number
  pan: number
  fadeIn: number
  fadeOut: number
  scheduleMode: 'continuous' | 'periodic' | 'random'
  panModMode: 'static' | 'sweep' | 'random'
  isPlaying: boolean
}

interface InternalTrack {
  id: string
  source: AudioBufferSourceNode | null
  gain: GainNode
  panNode: StereoPannerNode
  buffer: AudioBuffer
  options: Required<InternalTrackOptions>
  isPlaying: boolean
  scheduleTimer: ReturnType<typeof setTimeout> | null
  panTimer: ReturnType<typeof setTimeout> | null
  panBase: number
}

interface InternalTrackOptions {
  volume: number
  pan: number
  fadeIn: number
  fadeOut: number
  scheduleMode: 'continuous' | 'periodic' | 'random'
  scheduleInterval: number
  scheduleIntervalMin: number
  scheduleIntervalMax: number
  panModMode: 'static' | 'sweep' | 'random'
  panSweepRate: number
  panSpread: number
}

const DEFAULTS: InternalTrackOptions = {
  volume: 0.5,
  pan: 0,
  fadeIn: 1.0,
  fadeOut: 1.5,
  scheduleMode: 'continuous',
  scheduleInterval: 10,
  scheduleIntervalMin: 5,
  scheduleIntervalMax: 20,
  panModMode: 'static',
  panSweepRate: 8,
  panSpread: 0.5,
}

export class SoundMixer {
  private ctx: AudioContext
  private masterGain: GainNode
  private tracks = new Map<string, InternalTrack>()
  private _volume = 0.75

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this._volume
    this.masterGain.connect(this.ctx.destination)
  }

  get context(): AudioContext {
    return this.ctx
  }

  get volume(): number {
    return this._volume
  }

  setVolume(v: number): void {
    if (!this.checkAlive()) return
    this._volume = Math.max(0, Math.min(1, v))
    this.masterGain.gain.value = this._volume
  }

  private ensureResumed(): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('SoundMixer: resume failed', e))
    }
  }

  private checkAlive(): boolean {
    return this.ctx.state !== 'closed'
  }

  async addTrack(id: string, url: string, options?: TrackOptions): Promise<void> {
    if (!this.checkAlive()) return
    if (this.tracks.has(id)) {
      this.removeTrack(id)
    }

    this.ensureResumed()

    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Failed to load audio: ${resp.status}`)
    const arrayBuffer = await resp.arrayBuffer()
    let audioBuffer: AudioBuffer
    try {
      audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
    } catch (e) {
      console.warn('SoundMixer: decodeAudioData failed', e)
      throw new Error('Failed to decode audio')
    }

    const opts: InternalTrackOptions = { ...DEFAULTS, ...options }

    const gain = this.ctx.createGain()
    gain.gain.value = 0

    const panNode = this.ctx.createStereoPanner()
    panNode.pan.value = opts.pan

    gain.connect(panNode)
    panNode.connect(this.masterGain)

    const track: InternalTrack = {
      id,
      source: null,
      gain,
      panNode,
      buffer: audioBuffer,
      options: opts,
      isPlaying: false,
      scheduleTimer: null,
      panTimer: null,
      panBase: opts.pan,
    }

    this.tracks.set(id, track)

    if (opts.volume > 0) {
      this.play(id)
    }
  }

  removeTrack(id: string): void {
    if (!this.checkAlive()) return
    const track = this.tracks.get(id)
    if (!track) return

    this.clearTimers(track)

    if (track.source) {
      try {
        const now = this.ctx.currentTime
        track.gain.gain.cancelScheduledValues(now)
        track.source.stop()
      } catch (e) { console.warn('SoundMixer: removeTrack stop failed', e) }
    }
    track.gain.disconnect()
    track.panNode.disconnect()
    this.tracks.delete(id)
  }

  hasTrack(id: string): boolean {
    return this.tracks.has(id)
  }

  private clearTimers(track: InternalTrack): void {
    if (track.scheduleTimer) {
      clearTimeout(track.scheduleTimer)
      track.scheduleTimer = null
    }
    if (track.panTimer) {
      clearTimeout(track.panTimer)
      track.panTimer = null
    }
  }

  private createAndStartSource(track: InternalTrack, now: number, duration: number): void {
    const source = this.ctx.createBufferSource()
    source.buffer = track.buffer
    source.loop = duration === Infinity

    source.connect(track.gain)

    const { volume, fadeIn, fadeOut } = track.options

    if (duration === Infinity) {
      track.gain.gain.cancelScheduledValues(now)
      track.gain.gain.setValueAtTime(0, now)
      track.gain.gain.linearRampToValueAtTime(volume, now + fadeIn)
      source.start(now)
    } else {
      const cycleEnd = now + duration
      const fadeOutStart = cycleEnd - fadeOut

      track.gain.gain.cancelScheduledValues(now)
      track.gain.gain.setValueAtTime(0, now)
      track.gain.gain.linearRampToValueAtTime(volume, now + fadeIn)
      track.gain.gain.setValueAtTime(volume, Math.max(now + fadeIn, fadeOutStart))
      track.gain.gain.linearRampToValueAtTime(0.001, cycleEnd)

      source.start(now)
      source.stop(cycleEnd + 0.05)
    }

    track.source = source
    track.isPlaying = true
  }

  play(id: string): void {
    if (!this.checkAlive()) return
    const track = this.tracks.get(id)
    if (!track || track.isPlaying) return

    this.ensureResumed()
    this.clearTimers(track)

    const mode = track.options.scheduleMode
    const now = this.ctx.currentTime

    track.panBase = track.options.pan

    if (mode === 'continuous') {
      this.createAndStartSource(track, now, Infinity)
      this.startPanModulation(track)
    } else {
      this.scheduleCycle(track, now)
    }
  }

  private scheduleCycle(track: InternalTrack, now: number): void {
    const mode = track.options.scheduleMode
    let interval = track.options.scheduleInterval

    if (mode === 'random') {
      const min = track.options.scheduleIntervalMin
      const max = track.options.scheduleIntervalMax
      interval = min + Math.random() * (max - min)
    }

    this.createAndStartSource(track, now, interval)
    this.startPanModulation(track)

    const delayMs = interval * 1000
    track.scheduleTimer = setTimeout(() => {
      track.isPlaying = false
      track.source = null
      const nextNow = this.ctx.currentTime
      this.scheduleCycle(track, nextNow)
    }, delayMs)
  }

  private startPanModulation(track: InternalTrack): void {
    this.stopPanModulation(track)

    const mode = track.options.panModMode
    if (mode === 'static') return

    if (mode === 'sweep') {
      const rate = track.options.panSweepRate
      const spread = track.options.panSpread
      const base = track.panBase
      const startTime = this.ctx.currentTime

      const tick = () => {
        if (!track.isPlaying && !track.source) return
        const elapsed = this.ctx.currentTime - startTime
        const val = base + Math.sin(elapsed * (2 * Math.PI / rate)) * spread
        track.panNode.pan.value = Math.max(-1, Math.min(1, val))
        track.panTimer = setTimeout(tick, 50)
      }
      tick()
    }

    if (mode === 'random') {
      const spread = track.options.panSpread
      const base = track.panBase

      const tick = () => {
        if (!track.isPlaying && !track.source) return
        const val = base + (Math.random() * 2 - 1) * spread
        track.panNode.pan.value = Math.max(-1, Math.min(1, val))
        const nextDelay = 200 + Math.random() * 800
        track.panTimer = setTimeout(tick, nextDelay)
      }
      tick()
    }
  }

  private stopPanModulation(track: InternalTrack): void {
    if (track.panTimer) {
      clearTimeout(track.panTimer)
      track.panTimer = null
    }
  }

  stop(id: string): void {
    if (!this.checkAlive()) return
    const track = this.tracks.get(id)
    if (!track || !track.isPlaying) return

    this.clearTimers(track)
    this.stopPanModulation(track)

    if (track.source) {
      const now = this.ctx.currentTime
      track.gain.gain.cancelScheduledValues(now)
      track.gain.gain.setTargetAtTime(0.001, now, track.options.fadeOut * 0.3)

      const stopTime = now + track.options.fadeOut + 0.05
      track.source.stop(stopTime)
      track.source = null
    }

    track.isPlaying = false
  }

  toggle(id: string): void {
    const track = this.tracks.get(id)
    if (!track) return
    if (track.isPlaying) {
      this.stop(id)
    } else {
      this.play(id)
    }
  }

  playAll(): void {
    for (const id of this.tracks.keys()) {
      this.play(id)
    }
  }

  stopAll(): void {
    for (const id of this.tracks.keys()) {
      this.stop(id)
    }
  }

  stopAllImmediate(): void {
    for (const track of this.tracks.values()) {
      this.clearTimers(track)
      this.stopPanModulation(track)
      if (track.source) {
        try {
          const now = this.ctx.currentTime
          track.gain.gain.cancelScheduledValues(now)
          track.source.stop()
        } catch (e) { console.warn('SoundMixer: stopAllImmediate failed', e) }
      }
      track.isPlaying = false
      track.source = null
    }
  }

  setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id)
    if (!track) return
    track.options.volume = Math.max(0, Math.min(1, volume))
    if (track.isPlaying) {
      const now = this.ctx.currentTime
      track.gain.gain.cancelScheduledValues(now)
      track.gain.gain.setTargetAtTime(track.options.volume, now, 0.05)
    }
  }

  setTrackPan(id: string, pan: number): void {
    const track = this.tracks.get(id)
    if (!track) return
    track.options.pan = Math.max(-1, Math.min(1, pan))
    track.panBase = track.options.pan
    if (track.options.panModMode === 'static') {
      track.panNode.pan.value = track.options.pan
    }
  }

  setTrackSchedule(
    id: string,
    mode: 'continuous' | 'periodic' | 'random',
    interval?: number,
    intervalMin?: number,
    intervalMax?: number,
    fadeIn?: number,
    fadeOut?: number,
  ): void {
    const track = this.tracks.get(id)
    if (!track) return

    const wasPlaying = track.isPlaying
    if (wasPlaying) {
      this.stop(id)
    }

    track.options.scheduleMode = mode
    if (interval !== undefined) track.options.scheduleInterval = interval
    if (intervalMin !== undefined) track.options.scheduleIntervalMin = intervalMin
    if (intervalMax !== undefined) track.options.scheduleIntervalMax = intervalMax
    if (fadeIn !== undefined) track.options.fadeIn = Math.max(0.1, fadeIn)
    if (fadeOut !== undefined) track.options.fadeOut = Math.max(0.1, fadeOut)

    if (wasPlaying) {
      this.play(id)
    }
  }

  setTrackPanModulation(
    id: string,
    mode: 'static' | 'sweep' | 'random',
    sweepRate?: number,
    spread?: number,
  ): void {
    const track = this.tracks.get(id)
    if (!track) return

    const wasPlaying = track.isPlaying
    this.stopPanModulation(track)

    track.options.panModMode = mode
    if (sweepRate !== undefined) track.options.panSweepRate = sweepRate
    if (spread !== undefined) track.options.panSpread = Math.max(0, Math.min(1, spread))

    if (mode === 'static') {
      track.panNode.pan.value = track.options.pan
    }

    if (wasPlaying) {
      this.startPanModulation(track)
    }
  }

  setTrackFade(id: string, seconds: number): void {
    const track = this.tracks.get(id)
    if (!track) return
    track.options.fadeIn = Math.max(0.1, seconds)
    track.options.fadeOut = Math.max(0.1, seconds)
  }

  setTrackFadeIn(id: string, seconds: number): void {
    const track = this.tracks.get(id)
    if (!track) return
    track.options.fadeIn = Math.max(0.1, seconds)
  }

  setTrackFadeOut(id: string, seconds: number): void {
    const track = this.tracks.get(id)
    if (!track) return
    track.options.fadeOut = Math.max(0.1, seconds)
  }

  getInfo(): TrackInfo[] {
    const result: TrackInfo[] = []
    for (const track of this.tracks.values()) {
      result.push({
        id: track.id,
        volume: track.options.volume,
        pan: track.options.pan,
        fadeIn: track.options.fadeIn,
        fadeOut: track.options.fadeOut,
        scheduleMode: track.options.scheduleMode,
        panModMode: track.options.panModMode,
        isPlaying: track.isPlaying,
      })
    }
    return result
  }

  destroy(): void {
    if (!this.checkAlive()) return
    this.stopAllImmediate()
    for (const track of this.tracks.values()) {
      track.gain.disconnect()
      track.panNode.disconnect()
    }
    this.tracks.clear()
    this.masterGain.disconnect()
    if (this.ctx.state !== 'closed') {
      this.ctx.close()
    }
  }
}
