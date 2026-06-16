let ctx: AudioContext | null = null

export function getSharedAudioContext(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext()
  }
  return ctx
}

export async function ensureAudioContext(): Promise<AudioContext> {
  const c = getSharedAudioContext()
  if (c.state === 'suspended') {
    await c.resume()
  }
  return c
}

export function closeSharedAudioContext(): void {
  ctx?.close()
  ctx = null
}
