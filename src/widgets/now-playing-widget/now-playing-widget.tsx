import { Text, Stack, Badge } from '@mantine/core'
import { usePlayerIsPlaying, usePlayerPlayingTitle, usePlayerSubtitle, usePlayerType } from '@/stores/player-store'

export default function NowPlayingWidget() {
  const isPlaying = usePlayerIsPlaying()
  const playingTitle = usePlayerPlayingTitle()
  const subtitle = usePlayerSubtitle()
  const type = usePlayerType()

  if (!isPlaying) {
    return (
      <Stack align="center" gap="xs">
        <Text size="sm" c="dimmed">Nothing playing</Text>
      </Stack>
    )
  }

  const typeLabel = type === 'somafm' ? 'Radio' : type === 'moodist' ? 'Ambient' : 'Stream'

  return (
    <Stack align="center" gap={4}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--mantine-color-accent-5)',
          animation: 'pulse 1.2s infinite',
        }}
      />
      <Text size="sm" fw={600} ta="center" truncate="end" style={{ maxWidth: '100%' }}>
        {playingTitle || 'Playing'}
      </Text>
      {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
      <Badge size="xs" variant="light" color="accent">{typeLabel}</Badge>
    </Stack>
  )
}
