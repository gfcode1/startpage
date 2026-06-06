export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _muted = false
  private _volume = 0.3

  init(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = this._muted ? 0 : this._volume
    this.master.connect(this.ctx.destination)
  }

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state !== 'closed'
  }

  get muted(): boolean {
    return this._muted
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  get volume(): number {
    return this._volume
  }

  setMute(m: boolean): void {
    this._muted = m
    if (!this.ensure()) return
    this.master!.gain.value = m ? 0 : this._volume
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v))
    if (this.master && !this._muted) this.master.gain.value = this._volume
  }

  private ensure(): boolean {
    if (!this.ready) return false
    if (this.ctx!.state === 'suspended') this.ctx!.resume()
    return true
  }

  private osc(
    freq: number,
    type: OscillatorType,
    duration: number,
    gainStart: number,
    gainEnd: number
  ): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(gainStart, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.001), now + duration)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(now)
    osc.stop(now + duration)
  }

  playClick(): void {
    this.osc(800, 'square', 0.04, 0.15, 0.001)
  }

  playHover(): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(now)
    osc.stop(now + 0.03)
  }

  playMove(): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  playMerge(value?: number): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const base = 440
    const mult = value ? Math.min(1 + Math.log2(value) * 0.1, 3) : 2
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(base, now)
    osc.frequency.exponentialRampToValueAtTime(base * mult, now + 0.1)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  playNewTile(): void {
    this.osc(600, 'sine', 0.06, 0.12, 0.001)
  }

  playGameOver(): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(now)
    osc.stop(now + 0.4)
  }

  playVictory(): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'sine'
      const t = now + i * 0.12
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.connect(gain)
      gain.connect(this.master!)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  }
}
