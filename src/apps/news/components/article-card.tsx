import { Text, Group, Paper, Badge, ActionIcon, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { NewsArticle } from '../types'
import { timeAgo } from '../utils'

interface ArticleCardProps {
  article: NewsArticle
  onSelect: (article: NewsArticle) => void
  onToggleBookmark: (id: string) => void
}

export function ArticleCard({ article, onSelect, onToggleBookmark }: ArticleCardProps) {
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(article.link).catch(() => {})
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({ title: article.title, url: article.link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(article.link).catch(() => {})
    }
  }
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        opacity: article.isRead ? 0.75 : 1,
      }}
      onClick={() => onSelect(article)}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {article.imageUrl && (
          <div
            style={{
              width: 80,
              height: 60,
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'var(--mantine-color-default-hover)',
            }}
          >
            <img
              src={article.imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) parent.style.display = 'none'
              }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" mb={2} wrap="nowrap">
            <Text size="sm" fw={600} truncate="end" style={{ flex: 1 }}>
              {!article.isRead && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-accent-filled)',
                    marginRight: 6,
                    verticalAlign: 'middle',
                  }}
                />
              )}
              {article.title || 'Untitled'}
            </Text>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(article.id) }}
            >
              <Icon
                icon={article.isBookmarked ? 'lucide:bookmark-check' : 'lucide:bookmark'}
                width={14}
                color={article.isBookmarked ? 'var(--mantine-color-accent-filled)' : undefined}
              />
            </ActionIcon>
            <Tooltip label="Copy link" withArrow>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleCopyLink}
              >
                <Icon icon="lucide:link" width={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Share" withArrow>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleShare}
              >
                <Icon icon="lucide:share" width={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          {article.description && (
            <Text size="xs" c="dimmed" lineClamp={2} mb={4}>
              {article.description}
            </Text>
          )}
          <Group gap={6}>
            <Badge size="xs" variant="light" color="gray">{article.feedTitle}</Badge>
            <Text size="xs" c="dimmed">{timeAgo(article.publishedAt)}</Text>
            {typeof article.author === 'string' && <Text size="xs" c="dimmed">· {article.author}</Text>}
          </Group>
        </div>
      </Group>
    </Paper>
  )
}
