import { useEffect } from 'react'
import { Text, Group, Stack } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useNewsStore } from '@/stores/news-store'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'
import { WidgetContainer, WidgetLoading, WidgetEmpty } from '@/ui/widget-container'
import { timeAgo } from '../utils'

export default function NewsWidget() {
  const navigate = useNavigate()
  const maxArticles = useWidgetOptionsStore((s) => (s.options.news?.maxArticles as number) ?? 5)
  const init = useNewsStore((s) => s.init)
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const articles = useNewsStore((s) => s.articles)
  const refreshAllFeeds = useNewsStore((s) => s.refreshAllFeeds)
  const isRefreshing = useNewsStore((s) => s.isRefreshing)
  const activeIds = [...enabledFeedIds, ...customFeeds.map((f) => f.id)]
  const hasFeeds = activeIds.length > 0

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (hasFeeds) {
      const hasContent = Object.values(articles).some((c) => c.items.length > 0)
      if (!hasContent) refreshAllFeeds()
    }
  }, [hasFeeds, articles, refreshAllFeeds])

  if (!hasFeeds) {
    return (
      <WidgetContainer>
        <Text size="sm" fw={600}>News</Text>
        <WidgetEmpty>No feeds added</WidgetEmpty>
      </WidgetContainer>
    )
  }

  const allArticles = activeIds
    .flatMap((id) => articles[id]?.items ?? [])
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, maxArticles)

  if (allArticles.length === 0) {
    if (isRefreshing) return <WidgetLoading />
    return (
      <WidgetContainer>
        <Text size="sm" fw={600}>News</Text>
        <WidgetEmpty>No articles yet</WidgetEmpty>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer>
      <Group gap="xs" onClick={() => navigate('/news')} style={{ cursor: 'pointer' }}>
        <Icon icon="lucide:rss" width={14} />
        <Text size="sm" fw={600}>News</Text>
      </Group>
      <Stack gap={4}>
        {allArticles.map((article) => (
          <Group
            key={article.id}
            gap="xs"
            wrap="nowrap"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/news')}
          >
            {article.imageUrl && (
              <div
                style={{
                  width: 40,
                  height: 30,
                  borderRadius: 4,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--mantine-color-default-hover)',
                  position: 'relative',
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
                {!article.isRead && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--mantine-color-accent-filled)',
                    }}
                  />
                )}
              </div>
            )}
            {!article.isRead && !article.imageUrl && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-accent-filled)',
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" lineClamp={1}>
                {article.title}
              </Text>
              <Group gap={4}>
                <Text size="10px" c="dimmed" truncate style={{ maxWidth: 80 }}>
                  {article.feedTitle}
                </Text>
                <Text size="10px" c="dimmed">·</Text>
                <Text size="10px" c="dimmed">{timeAgo(article.publishedAt)}</Text>
              </Group>
            </div>
          </Group>
        ))}
      </Stack>
    </WidgetContainer>
  )
}
