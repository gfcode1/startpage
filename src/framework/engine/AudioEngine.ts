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

  destroy(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.ctx = null
    this.master = null
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

  playTone(freq: number, type: OscillatorType, duration: number, gainStart: number, gainEnd: number): void {
    this.osc(freq, type, duration, gainStart, gainEnd)
  }

  playSweep(fromFreq: number, toFreq: number, type: OscillatorType, duration: number, gain: number): void {
    if (!this.ensure()) return
    const now = this.ctx!.currentTime
    const osc = this.ctx!.createOscillator()
    const gainNode = this.ctx!.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(fromFreq, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(toFreq, 20), now + duration)
    gainNode.gain.setValueAtTime(gain, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gainNode)
    gainNode.connect(this.master!)
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
}
