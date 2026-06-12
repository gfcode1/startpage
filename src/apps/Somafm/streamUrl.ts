const ICE_SERVERS = ['ice2', 'ice3', 'ice4', 'ice5', 'ice6']

export function pickServer(): string {
  return ICE_SERVERS[Math.floor(Math.random() * ICE_SERVERS.length)]
}

export function parseBitrate(slug: string): { channel: string; bitrate: string } {
  const bitMatch = slug.match(/^(.*?)(\d+)$/)
  return bitMatch
    ? { channel: bitMatch[1], bitrate: bitMatch[2] }
    : { channel: slug, bitrate: '128' }
}

export function parseStreamUrl(playlistUrl: string | undefined): string | null {
  if (!playlistUrl) return null
  const match = playlistUrl.match(/\/api\.somafm\.com\/(.+)\.pls/)
  if (!match) return null
  const slug = match[1]
  const { channel, bitrate } = parseBitrate(slug)
  const server = pickServer()
  return `https://${server}.somafm.com/${channel}-${bitrate}-mp3`
}

export function deriveQualityUrls(channel: string, qualities: string[]): string[] {
  return qualities.map(q => {
    const server = pickServer()
    return `https://${server}.somafm.com/${channel}-${q}-mp3`
  })
}

export const QUALITY_OPTIONS = ['highest', 'lowest', 'ask'] as const
export type QualityPreference = (typeof QUALITY_OPTIONS)[number]
