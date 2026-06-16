import { Paper, Text, Group, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import DOMPurify from 'dompurify'
import type { WikiPage } from '../types'

interface ArticleCardProps {
  page: WikiPage
  isBookmarked: boolean
  onSelect: (id: number) => void
  onToggleBookmark: (pageid: number, title: string, thumbnail?: string) => void
}

export function ArticleCard({ page, isBookmarked, onSelect, onToggleBookmark }: ArticleCardProps) {
  return (
    <Paper
      withBorder
      p="sm"
      mb="xs"
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(page.pageid)}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {page.thumbnail && (
          <img
            src={page.thumbnail.source}
            alt=""
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              borderRadius: 'var(--mantine-radius-sm)',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap" mb={4}>
            <Text size="sm" fw={600} truncate="end" style={{ flex: 1 }}>
              {page.title}
            </Text>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleBookmark(page.pageid, page.title, page.thumbnail?.source)
              }}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Icon
                icon={isBookmarked ? 'lucide:bookmark' : 'lucide:bookmark-plus'}
                width={14}
              />
            </ActionIcon>
          </Group>
          <Text
            size="xs"
            c="dimmed"
            lineClamp={2}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.snippet) }}
          />
        </div>
      </Group>
    </Paper>
  )
}
