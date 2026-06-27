import { useEffect, useRef, useState } from 'react'
import { Group, Text, ActionIcon, Slider, Paper, Tooltip, Badge, Transition, Box } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import {
  usePlayerIsPlaying, usePlayerPlayingTitle, usePlayerSubtitle,
  usePlayerVolume, usePlayerQueue, usePlayerSleepTimer,
  usePlayerStop, usePlayerSetVolume, usePlayerClearQueue,
  usePlayerClearSleepTimer,
} from '@/stores/player-store'

export function PlayerBar() {
  const isPlaying = usePlayerIsPlaying()
  const playingTitle = usePlayerPlayingTitle()
  const subtitle = usePlayerSubtitle()
  const volume = usePlayerVolume()
  const queue = usePlayerQueue()
  const sleepTimer = usePlayerSleepTimer()
  const stop = usePlayerStop()
  const setVolume = usePlayerSetVolume()
  const clearQueue = usePlayerClearQueue()
  const clearSleepTimer = usePlayerClearSleepTimer()
  const isMobile = useMediaQuery('(max-width: 47.999em)')
  const [remaining, setRemaining] = useState(
    () => sleepTimer !== null ? Math.max(0, Math.floor((sleepTimer - Date.now()) / 1000)) : 0,
  )
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasTimer = sleepTimer !== null

  useEffect(() => {
    if (!hasTimer || sleepTimer === null) return

    const tick = () => {
      const rem = Math.max(0, Math.floor((sleepTimer - Date.now()) / 1000))
      setRemaining(rem)
      if (rem <= 0) {
        stop()
        clearSleepTimer()
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasTimer, sleepTimer, stop, clearSleepTimer])

  return (
    <Transition mounted={isPlaying} transition="slide-up" duration={300}>
      {(styles) => (
        <Paper
          withBorder
          shadow="md"
          style={{
            ...styles,
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            borderBottom: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined,
          }}
          p={isMobile ? 'xs' : 'sm'}
          bg="var(--mantine-color-body)"
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-accent-5)',
                  animation: isPlaying ? 'pulse 1.2s infinite' : 'none',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} truncate="end">{playingTitle || 'No track'}</Text>
                {subtitle && <Text size="xs" c="dimmed" truncate="end">{subtitle}</Text>}
              </div>
            </Group>

            <Group gap="xs" wrap="nowrap">
              {hasTimer && remaining > 0 && (
                <Tooltip label={`${Math.floor(remaining / 60)}m remaining`}>
                  <Badge size="xs" variant="light" color="yellow">
                    {Math.floor(remaining / 60)}m
                  </Badge>
                </Tooltip>
              )}

              {!isMobile && queue.length > 0 && (
                <Tooltip label={`${queue.length} in queue`}>
                  <ActionIcon variant="subtle" onClick={clearQueue} aria-label="Clear queue">
                    <Icon icon="lucide:list" width={16} />
                    <Text size="xs" style={{ position: 'absolute', top: 2, right: 2 }}>
                      {queue.length}
                    </Text>
                  </ActionIcon>
                </Tooltip>
              )}

              <ActionIcon variant="filled" color="accent" onClick={stop} aria-label="Stop">
                <Icon icon="lucide:square" width={14} />
              </ActionIcon>

              <Group gap={4} wrap="nowrap" style={{ width: isMobile ? 60 : 100 }}>
                <Icon icon="lucide:volume" width={14} />
                <Slider
                  value={volume}
                  onChange={setVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ flex: 1 }}
                  size="xs"
                />
              </Group>
            </Group>
          </Group>
        </Paper>
      )}
    </Transition>
  )
}
