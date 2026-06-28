export function formatTime(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  const suffix = '...'
  const limit = Math.max(0, max - suffix.length)
  return str.slice(0, limit).trimEnd() + suffix
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
