import { useState, useEffect, useRef, useCallback } from 'react'
import { Container, Text, SimpleGrid, Paper, Group, Badge, Loader, Center, ActionIcon, Slider } from '@mantine/core'
import { Icon } from '@iconify/react'
import { Howl } from 'howler'
import { usePlayerPlay, usePlayerStop, usePlayerSetPlaying, usePlayerSetLoading, usePlayerSetPlayInfo, usePlayerVolume, usePlayerSetVolume } from '@/stores/player-store'

interface SomaChannel {
  id: string
  title: string
  description: string
  playlist: string
  listeners: string
  image: string
  genre: string
}

async function fetchChannels(abort: AbortSignal): Promise<SomaChannel[]> {
  const res = await fetch('https://somafm.com/channels.json', { signal: abort })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return ((data.channels ?? []) as Array<Record<string, unknown>>).map((ch) => ({
    id: String(ch.id ?? ''),
    title: String(ch.title ?? ''),
    description: String(ch.description ?? ''),
    playlist: String((ch.playlists as Array<Record<string, unknown>>)?.[0]?.url ?? ''),
    listeners: String(ch.listeners ?? ''),
    image: String(ch.image ?? ''),
    genre: String(ch.genre ?? ''),
  }))
}

async function resolveStreamUrl(playlistUrl: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(playlistUrl, { signal })
  if (!res.ok) throw new Error(`Failed to fetch playlist: HTTP ${res.status}`)
  const text = await res.text()

  // Try parse PLS format
  const plsMatch = text.match(/File\d+=(.+)/i)
  if (plsMatch) return plsMatch[1]!.trim()

  // Try parse M3U format
  const m3uMatch = text.match(/^https?:\/\/.+/m)
  if (m3uMatch) return m3uMatch[0].trim()

  // Fallback: assume the URL itself is a direct stream
  return playlistUrl
}

export default function SomafmApp() {
  const [channels, setChannels] = useState<SomaChannel[]>([])
  const [loading, setLocalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [errorChannel, setErrorChannel] = useState<string | null>(null)
  const howlRef = useRef<Howl | null>(null)
  const togglingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const play = usePlayerPlay()
  const stop = usePlayerStop()
  const setPlaying = usePlayerSetPlaying()
  const setStoreLoading = usePlayerSetLoading()
  const setPlayInfo = usePlayerSetPlayInfo()
  const volume = usePlayerVolume()
  const setVolume = usePlayerSetVolume()

  // Fetch channels
  useEffect(() => {
    const abort = new AbortController()
    fetchChannels(abort.signal)
      .then((chs) => { setChannels(chs); setLocalLoading(false) })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return
        setError('Failed to load channels')
        setLocalLoading(false)
      })
    return () => abort.abort()
  }, [])

  // Stop player and unload Howl on unmount
  useEffect(() => {
    return () => {
      howlRef.current?.unload()
      howlRef.current = null
      stop()
    }
  }, [stop])

  // Sync volume to active Howl
  useEffect(() => {
    if (howlRef.current) howlRef.current.volume(volume)
  }, [volume])

  const togglePlay = useCallback(async (channel: SomaChannel) => {
    if (togglingRef.current) return
    togglingRef.current = true
    setErrorChannel(null)

    if (playingId === channel.id) {
      howlRef.current?.unload()
      howlRef.current = null
      setPlayingId(null)
      stop()
      togglingRef.current = false
      return
    }

    howlRef.current?.unload()
    setPlayingId(channel.id)
    setStoreLoading(true)
    setPlayInfo(channel.title, channel.genre)

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const streamUrl = await resolveStreamUrl(channel.playlist, abortRef.current.signal)

      const howl = new Howl({
        src: [streamUrl],
        html5: true,
        volume,
        onplay: () => {
          setPlaying(true)
          setStoreLoading(false)
          play({ id: channel.id, title: channel.title, subtitle: channel.genre, type: 'somafm' })
        },
        onloaderror: () => {
          setStoreLoading(false)
          setErrorChannel(channel.id)
          setPlayingId(null)
          stop()
        },
        onpause: () => setPlaying(false),
        onstop: () => { setPlayingId(null); stop() },
      })

      howl.play()
      howlRef.current = howl
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') { togglingRef.current = false; return }
      setStoreLoading(false)
      setErrorChannel(channel.id)
      setPlayingId(null)
      stop()
    }

    togglingRef.current = false
  }, [playingId, play, stop, setPlaying, setStoreLoading, setPlayInfo, volume])

  if (loading) return <Center py="xl"><Loader /></Center>
  if (error) return <Center py="xl"><Text c="red">{error}</Text></Center>

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
          SomaFM
        </Text>
        <Group gap="xs">
          <Icon icon={volume > 0 ? 'lucide:volume-2' : 'lucide:volume-x'} width={16} />
          <Slider
            value={volume}
            onChange={setVolume}
            min={0}
            max={1}
            step={0.01}
            size="xs"
            style={{ width: 80 }}
            aria-label="Volume"
          />
        </Group>
      </Group>

      {channels.length === 0 ? (
        <Center py="xl"><Text c="dimmed">No channels available</Text></Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {channels.map((ch) => (
            <Paper
              key={ch.id}
              withBorder
              p="sm"
              radius="md"
              style={{
                cursor: 'pointer',
                borderColor: playingId === ch.id ? 'var(--mantine-color-accent-5)' : undefined,
              }}
              onClick={() => togglePlay(ch)}
            >
              <Group gap="sm" wrap="nowrap">
                {ch.image && (
                  <img
                    src={ch.image}
                    alt={ch.title}
                    loading="lazy"
                    style={{ width: 48, height: 48, borderRadius: 'var(--mantine-radius-md)', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate="end">{ch.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>{ch.description}</Text>
                  <Group gap="xs" mt={4}>
                    <Badge size="xs" variant="light" color={errorChannel === ch.id ? 'red' : undefined}>
                      {errorChannel === ch.id ? 'Error' : ch.genre}
                    </Badge>
                    <Text size="xs" c="dimmed">▸ {ch.listeners}</Text>
                  </Group>
                </div>
                <ActionIcon
                  variant={playingId === ch.id ? 'filled' : 'subtle'}
                  color="accent"
                  onClick={(e) => { e.stopPropagation(); togglePlay(ch) }}
                  aria-label={playingId === ch.id ? 'Stop' : 'Play'}
                >
                  <Icon icon={playingId === ch.id ? 'lucide:square' : 'lucide:play'} width={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
}
