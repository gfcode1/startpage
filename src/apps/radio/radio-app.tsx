import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Container, Text, SimpleGrid, Paper, Group, Badge, Loader, Center,
  ActionIcon, Slider, Select, Divider, Button, Stack, Drawer,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { Howl } from 'howler'
import {
  usePlayerPlay, usePlayerStop, usePlayerSetPlaying, usePlayerSetLoading,
  usePlayerSetPlayInfo, usePlayerVolume, usePlayerSetVolume,
  usePlayerSetSleepTimer, usePlayerClearSleepTimer, usePlayerSleepTimer,
  usePlayerIsPlaying,
} from '@/stores/player-store'
import { getStorage } from '@/lib/storage/engine'
import { registerRehydrator } from '@/lib/sync/rehydrate'

interface RadioChannel {
  id: string
  title: string
  description: string
  playlist: string
  listeners: string
  image: string
  genre: string
}

const FAVORITES_KEY = 'radio:favorites'

function loadFavorites(): string[] {
  try {
    return getStorage().get<string[]>(FAVORITES_KEY) ?? []
  } catch {
    return []
  }
}

function saveFavorites(ids: string[]) {
  getStorage().set(FAVORITES_KEY, ids)
}

interface FetchResult { channels: RadioChannel[]; fromCache: boolean }

async function fetchChannelsWithRetry(
  signal: AbortSignal,
  maxRetries = 3,
): Promise<FetchResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://somafm.com/channels.json', { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const channels = ((data.channels ?? []) as Array<Record<string, unknown>>).map(
        (ch) => ({
          id: String(ch.id ?? ''),
          title: String(ch.title ?? ''),
          description: String(ch.description ?? ''),
          playlist: String(
            (ch.playlists as Array<Record<string, unknown>>)?.[0]?.url ?? '',
          ),
          listeners: String(ch.listeners ?? ''),
          image: String(ch.image ?? ''),
          genre: String(ch.genre ?? ''),
        }),
      )
      return { channels, fromCache: false }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') throw err
      if (attempt === maxRetries) throw err
      await new Promise((resolve, reject) => {
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
        signal.addEventListener('abort', onAbort, { once: true })
        const id = setTimeout(() => {
          signal.removeEventListener('abort', onAbort)
          resolve(undefined)
        }, Math.pow(2, attempt) * 1000)
        if (signal.aborted) {
          clearTimeout(id)
          reject(new DOMException('Aborted', 'AbortError'))
        }
      })
    }
  }
  throw new Error('Unreachable')
}

async function resolveStreamUrl(
  playlistUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(playlistUrl, { signal })
  if (!res.ok) throw new Error(`Failed to fetch playlist: HTTP ${res.status}`)
  const text = await res.text()

  const plsMatch = text.match(/File\d+=(.+)/i)
  if (plsMatch) return plsMatch[1]!.trim()

  const m3uMatch = text.match(/^https?:\/\/.+/m)
  if (m3uMatch) return m3uMatch[0].trim()

  return playlistUrl
}

const SLEEP_DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
]

export default function RadioApp() {
  const [channels, setChannels] = useState<RadioChannel[]>([])
  const [loading, setLocalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [errorChannel, setErrorChannel] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)
  const [sleepDrawerOpen, { open: openSleepDrawer, close: closeSleepDrawer }] = useDisclosure()

  const howlRef = useRef<Howl | null>(null)
  const togglingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const favRaceRef = useRef(false)
  const pendingPlayRef = useRef(false)
  const sleepTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const play = usePlayerPlay()
  const stop = usePlayerStop()
  const setPlaying = usePlayerSetPlaying()
  const setStoreLoading = usePlayerSetLoading()
  const setPlayInfo = usePlayerSetPlayInfo()
  const volume = usePlayerVolume()
  const setVolume = usePlayerSetVolume()
  const setSleepTimer = usePlayerSetSleepTimer()
  const clearSleepTimer = usePlayerClearSleepTimer()
  const sleepTimer = usePlayerSleepTimer()
  const storeIsPlaying = usePlayerIsPlaying()
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(() => {
    if (!sleepTimer) return null
    const rem = Math.max(0, Math.floor((sleepTimer - Date.now()) / 60_000))
    return rem > 0 ? `${rem}m` : null
  })
  const [selectedDuration, setSelectedDuration] = useState<string | null>(() => {
    if (!sleepTimer) return null
    const rem = Math.max(0, Math.floor((sleepTimer - Date.now()) / 60_000))
    const minutes = Math.round(rem)
    const match = SLEEP_DURATIONS.find((d) => Number(d.value) === minutes)
    return match ? match.value : null
  })

  const fetchChannels = useCallback(async (retry = false) => {
    if (retry) setRetrying(true)
    setLocalLoading(true)
    setError(null)
    try {
      const { channels: chs } = await fetchChannelsWithRetry(abortRef.current!.signal)
      setChannels(chs)
      setError(null)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setError('Failed to load channels')
    } finally {
      setLocalLoading(false)
      setRetrying(false)
    }
  }, [])

  useEffect(() => {
    abortRef.current = new AbortController()
    requestAnimationFrame(() => fetchChannels())
    return () => {
      abortRef.current?.abort()
      howlRef.current?.unload()
      howlRef.current = null
      stop()
    }
  }, [fetchChannels, stop])

  useEffect(() => {
    if (howlRef.current) howlRef.current.volume(volume)
  }, [volume])

  useEffect(() => {
    if (!sleepTimer) {
      if (sleepTickRef.current) clearInterval(sleepTickRef.current)
      sleepTickRef.current = null
      queueMicrotask(() => setSleepRemaining(null))
      return
    }
    const tick = () => {
      const rem = Math.max(0, Math.floor((sleepTimer - Date.now()) / 60_000))
      setSleepRemaining(rem > 0 ? `${rem}m` : null)
    }
    tick()
    sleepTickRef.current = setInterval(tick, 1000)
    return () => {
      if (sleepTickRef.current) clearInterval(sleepTickRef.current)
    }
  }, [sleepTimer])

  useEffect(() => {
    if (pendingPlayRef.current) return
    if (!storeIsPlaying && howlRef.current) {
      howlRef.current.unload()
      howlRef.current = null
      setPlayingId(null)
    }
  }, [storeIsPlaying])

  const toggleFavorite = useCallback((channelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (favRaceRef.current) return
    favRaceRef.current = true
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [channelId, ...prev]
      saveFavorites(next)
      return next
    })
    requestAnimationFrame(() => { favRaceRef.current = false })
  }, [])

  const togglePlay = useCallback(
    async (channel: RadioChannel) => {
      if (togglingRef.current) return
      togglingRef.current = true
      pendingPlayRef.current = true
      setErrorChannel(null)

      try {
        if (playingId === channel.id) {
          pendingPlayRef.current = false
          howlRef.current?.unload()
          howlRef.current = null
          setPlayingId(null)
          stop()
          return
        }

        howlRef.current?.unload()
        setPlayingId(channel.id)
        setStoreLoading(true)
        setPlayInfo(channel.title, channel.genre)

        abortRef.current?.abort()
        abortRef.current = new AbortController()
        const streamUrl = await resolveStreamUrl(
          channel.playlist,
          abortRef.current.signal,
        )

        const howl = new Howl({
          src: [streamUrl],
          html5: true,
          volume,
          onplay: () => {
            pendingPlayRef.current = false
            setErrorChannel(null)
            setPlaying(true)
            setStoreLoading(false)
            play({
              id: channel.id,
              title: channel.title,
              subtitle: channel.genre,
              type: 'radio',
            })
          },
          onloaderror: () => {
            pendingPlayRef.current = false
            setStoreLoading(false)
            setErrorChannel(channel.id)
            setPlayingId(null)
            stop()
          },
          onpause: () => setPlaying(false),
          onstop: () => {
            setPlayingId(null)
            stop()
          },
        })

        howl.play()
        howlRef.current = howl
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return
        pendingPlayRef.current = false
        setStoreLoading(false)
        setErrorChannel(channel.id)
        setPlayingId(null)
        stop()
      } finally {
        togglingRef.current = false
      }
    },
    [playingId, play, stop, setPlaying, setStoreLoading, setPlayInfo, volume],
  )

  const handleSleepTimer = useCallback(
    (value: string | null) => {
      setSelectedDuration(value)
      if (!value) {
        clearSleepTimer()
        return
      }
      setSleepTimer(Number(value))
      closeSleepDrawer()
    },
    [clearSleepTimer, setSleepTimer, closeSleepDrawer],
  )

  const groupedChannels = useMemo(() => {
    const favIds = new Set(favorites)
    const favs = channels.filter((ch) => favIds.has(ch.id))
    const rest = channels.filter((ch) => !favIds.has(ch.id))
    const sorted = [...favs, ...rest]

    const groups = new Map<string, RadioChannel[]>()
    for (const ch of sorted) {
      const genre = ch.genre || 'Other'
      if (!groups.has(genre)) groups.set(genre, [])
      groups.get(genre)!.push(ch)
    }
    return groups
  }, [channels, favorites])

  const renderChannelCard = (ch: RadioChannel) => {
    const isActive = playingId === ch.id
    const isError = errorChannel === ch.id
    const isFavorite = favorites.includes(ch.id)

    return (
      <Paper
        key={ch.id}
        withBorder
        p="sm"
        radius="md"
        style={{
          cursor: 'pointer',
          borderColor: isActive
            ? 'var(--mantine-color-accent-5)'
            : isFavorite
              ? 'var(--mantine-color-accent-2)'
              : undefined,
          borderWidth: isActive || isFavorite ? 2 : 1,
          transition: 'border-color 0.2s, border-width 0.2s',
        }}
        onClick={() => togglePlay(ch)}
      >
        <Group gap="sm" wrap="nowrap">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {ch.image ? (
              <img
                src={ch.image}
                alt={ch.title}
                loading="lazy"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--mantine-radius-md)',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Center
                w={64}
                h={64}
                style={{
                  borderRadius: 'var(--mantine-radius-md)',
                  background: 'var(--mantine-color-dark-5)',
                }}
              >
                <Icon icon="lucide:radio" width={28} />
              </Center>
            )}
            <ActionIcon
              size="xs"
              variant="transparent"
              color={isFavorite ? 'red' : 'gray'}
              onClick={(e) => toggleFavorite(ch.id, e)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--mantine-color-body)',
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              <Icon
                icon={isFavorite ? 'lucide:heart' : 'lucide:heart-off'}
                width={12}
              />
            </ActionIcon>
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Group gap={4} wrap="nowrap">
              <Text size="sm" fw={600} truncate="end" style={{ flex: 1 }}>
                {ch.title}
              </Text>
              {isFavorite && (
                <Icon
                  icon="lucide:heart"
                  width={12}
                  color="var(--mantine-color-red-5)"
                  style={{ flexShrink: 0 }}
                />
              )}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={2}>
              {ch.description}
            </Text>
            <Group gap="xs" mt={4}>
              <Badge
                size="xs"
                variant="light"
                color={isError ? 'red' : undefined}
              >
                {isError ? 'Error' : ch.genre}
              </Badge>
              <Text size="xs" c="dimmed">
                {ch.listeners} listeners
              </Text>
            </Group>
          </div>
          <ActionIcon
            variant={isActive ? 'filled' : 'subtle'}
            color="accent"
            size="lg"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay(ch)
            }}
            aria-label={isActive ? 'Stop' : 'Play'}
          >
            <Icon
              icon={isActive ? 'lucide:square' : 'lucide:play'}
              width={18}
            />
          </ActionIcon>
        </Group>
      </Paper>
    )
  }

  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="xs">
          <Loader />
          <Text size="sm" c="dimmed">
            Loading channels...
          </Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Text
          fw={700}
          size="lg"
          style={{ fontFamily: 'var(--mantine-heading-font-family)' }}
        >
          Radio
        </Text>
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={openSleepDrawer}
            aria-label="Sleep timer"
          >
            <Icon icon="lucide:moon" width={18} />
          </ActionIcon>
          {sleepRemaining && (
            <Badge size="xs" variant="light" color="accent">
              {sleepRemaining}
            </Badge>
          )}
          <Group gap="xs">
            <Icon
              icon={volume > 0 ? 'lucide:volume-2' : 'lucide:volume-x'}
              width={16}
            />
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
      </Group>

      {error ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Text c="red">{error}</Text>
            <Button
              size="sm"
              variant="light"
              loading={retrying}
              leftSection={<Icon icon="lucide:refresh-cw" width={14} />}
              onClick={() => fetchChannels(true)}
            >
              Retry
            </Button>
          </Stack>
        </Center>
      ) : channels.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">No channels available</Text>
        </Center>
      ) : (
        <>
          {favorites.length > 0 && (
            <Group gap="xs" mb="md">
              <Badge
                variant="dot"
                size="lg"
                color="red"
                leftSection={<Icon icon="lucide:heart" width={12} />}
              >
                {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
          )}
          {Array.from(groupedChannels).map(([genre, chs]) => (
            <div key={genre} style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
              <Group gap="xs" mb="xs">
                <Text
                  size="sm"
                  fw={600}
                  c="dimmed"
                  tt="uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  {genre}
                </Text>
                <Divider style={{ flex: 1 }} />
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {chs.map(renderChannelCard)}
              </SimpleGrid>
            </div>
          ))}
        </>
      )}

      <Drawer
        opened={sleepDrawerOpen}
        onClose={closeSleepDrawer}
        title="Sleep Timer"
        position="bottom"
        size="xs"
      >
        <Stack gap="md" pb="md">
          <Text size="sm" c="dimmed">
            Stop playback after:
          </Text>
          <Select
            data={SLEEP_DURATIONS}
            value={selectedDuration}
            onChange={handleSleepTimer}
            placeholder="Select duration"
            clearable
            searchable={false}
          />
          {sleepTimer && (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => {
                clearSleepTimer()
                setSelectedDuration(null)
                closeSleepDrawer()
              }}
            >
              Cancel timer
            </Button>
          )}
        </Stack>
      </Drawer>
    </Container>
  )
}

registerRehydrator((storage) => {
  const favs = storage.get<string[]>(FAVORITES_KEY)
  if (favs) saveFavorites(favs)
})
