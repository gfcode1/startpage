import type { Channel } from './types'
import fallbackData from './data/channels.json'

const API_URL = 'https://api.somafm.com/channels.json'

interface ApiResponse {
  channels: Channel[]
}

function normalize(channel: Channel): Channel {
  return {
    ...channel,
    listeners: typeof channel.listeners === 'string' ? Number(channel.listeners) : channel.listeners,
  }
}

export async function fetchChannels(signal?: AbortSignal): Promise<Channel[]> {
  const res = await fetch(API_URL, { signal })
  if (!res.ok) throw new Error(`SomaFM API returned ${res.status}`)
  const body: ApiResponse = await res.json()
  return body.channels.map(normalize)
}

export async function fetchChannelsWithFallback(signal?: AbortSignal): Promise<Channel[]> {
  try {
    return await fetchChannels(signal)
  } catch {
    if (signal?.aborted) throw signal.reason
    return fallbackData as Channel[]
  }
}
