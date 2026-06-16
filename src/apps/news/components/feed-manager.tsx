import { useState } from 'react'
import { Group, TextInput, Button, Badge, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'

export function FeedManager() {
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const catalog = useNewsStore((s) => s.catalog)
  const toggleFeed = useNewsStore((s) => s.toggleFeed)
  const removeFeed = useNewsStore((s) => s.removeFeed)
  const addCustomFeed = useNewsStore((s) => s.addCustomFeed)
  const refreshAllFeeds = useNewsStore((s) => s.refreshAllFeeds)
  const isRefreshing = useNewsStore((s) => s.isRefreshing)
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const enabledFeeds = [
    ...catalog.filter((f) => enabledFeedIds.includes(f.id)),
    ...customFeeds,
  ]

  async function handleAdd() {
    const trimmed = url.trim()
    if (!trimmed) return
    setAdding(true)
    await addCustomFeed(trimmed)
    setUrl('')
    setAdding(false)
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); handleAdd() }}
        style={{ display: 'flex', gap: 8, marginBottom: 12 }}
      >
        <TextInput
          placeholder="Add RSS feed URL..."
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          style={{ flex: 1 }}
          size="sm"
          leftSection={<Icon icon="lucide:rss" width={14} />}
        />
        <Button type="submit" variant="light" size="sm" loading={adding}>
          Add
        </Button>
      </form>

      <Group gap="xs" mb="xs">
        {enabledFeeds.map((feed) => (
          <Badge
            key={feed.id}
            variant="outline"
            size="sm"
            rightSection={
              <ActionIcon
                size="xs"
                variant="transparent"
                onClick={() => {
                  if (feed.category === 'Custom') {
                    removeFeed(feed.id)
                  } else {
                    toggleFeed(feed.id)
                  }
                }}
              >
                <Icon icon="lucide:x" width={10} />
              </ActionIcon>
            }
          >
            {feed.title.length > 25 ? feed.title.slice(0, 22) + '...' : feed.title}
          </Badge>
        ))}
        {enabledFeeds.length > 0 && (
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => refreshAllFeeds()}
            loading={isRefreshing}
          >
            <Icon icon="lucide:refresh-cw" width={14} />
          </ActionIcon>
        )}
      </Group>
    </div>
  )
}
