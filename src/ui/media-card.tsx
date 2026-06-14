import { Card, Group, Text, Badge, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'

interface MediaCardProps {
  title: string
  description?: string
  imageUrl?: string
  isPlaying?: boolean
  isFavorite?: boolean
  onPlay?: () => void
  onFavorite?: () => void
}

export function MediaCard({ title, description, imageUrl, isPlaying, isFavorite, onPlay, onFavorite }: MediaCardProps) {
  return (
    <Card withBorder padding="sm" radius="md">
      <Group gap="sm" wrap="nowrap">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--mantine-radius-md)',
            background: imageUrl ? `url(${imageUrl}) center/cover` : 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-6))',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!imageUrl && <Icon icon="lucide:music" width={20} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate="end">{title}</Text>
          {description && <Text size="xs" c="dimmed" truncate="end">{description}</Text>}
        </div>

        <Group gap="xs" wrap="nowrap">
          {isPlaying && (
            <Badge size="xs" variant="light" color="green" style={{ animation: 'pulse 1.2s infinite' }}>
              LIVE
            </Badge>
          )}
          {onFavorite && (
            <ActionIcon variant="subtle" onClick={onFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <Icon icon={isFavorite ? 'lucide:star' : 'lucide:star-outline'} width={16} />
            </ActionIcon>
          )}
          {onPlay && (
            <ActionIcon variant="filled" color="accent" onClick={onPlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              <Icon icon={isPlaying ? 'lucide:pause' : 'lucide:play'} width={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Card>
  )
}
