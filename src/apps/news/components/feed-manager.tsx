import { useState, useRef } from 'react'
import { Group, TextInput, Button, Badge, ActionIcon, Tooltip, Text } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { validateFeedUrl, generateOpml, parseOpml, timeAgo } from '../utils'

export function FeedManager() {
  const enabledFeedIds = useNewsStore((s) => s.enabledFeedIds)
  const customFeeds = useNewsStore((s) => s.customFeeds)
  const catalog = useNewsStore((s) => s.catalog)
  const toggleFeed = useNewsStore((s) => s.toggleFeed)
  const removeFeed = useNewsStore((s) => s.removeFeed)
  const addCustomFeed = useNewsStore((s) => s.addCustomFeed)
  const refreshAllFeeds = useNewsStore((s) => s.refreshAllFeeds)
  const isRefreshing = useNewsStore((s) => s.isRefreshing)
  const feedStats = useNewsStore((s) => s.feedStats)
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const enabledFeeds = [
    ...catalog.filter((f) => enabledFeedIds.includes(f.id)),
    ...customFeeds,
  ]

  async function handleAdd() {
    const trimmed = url.trim()
    if (!trimmed) return

    const exists = [...catalog, ...customFeeds].some(
      (f) => f.url.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setValidationError('Feed already added')
      return
    }

    setAdding(true)
    setValidationError(null)

    const result = await validateFeedUrl(trimmed)
    if (!result.valid) {
      setValidationError('Not a valid RSS/Atom feed')
      setAdding(false)
      return
    }

    await addCustomFeed(trimmed)
    setUrl('')
    setAdding(false)
    setValidationError(null)
  }

  function handleOpmlExport() {
    const allFeeds = [...catalog.filter((f) => enabledFeedIds.includes(f.id)), ...customFeeds]
    if (allFeeds.length === 0) return
    const xml = generateOpml(allFeeds)
    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'startdeck-feeds.opml'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  function handleOpmlImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const xml = reader.result as string
      const feeds = parseOpml(xml)
      const existingUrls = new Set(
        [...catalog, ...customFeeds, ...enabledFeedIds.map((id) => catalog.find((f) => f.id === id)).filter(Boolean) as typeof catalog].map((f) => f.url.toLowerCase())
      )
      for (const feed of feeds) {
        if (!existingUrls.has(feed.url.toLowerCase())) {
          existingUrls.add(feed.url.toLowerCase())
          await addCustomFeed(feed.url)
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); handleAdd() }}
        style={{ display: 'flex', gap: 8, marginBottom: 4 }}
      >
        <TextInput
          placeholder="Add RSS feed URL..."
          value={url}
          onChange={(e) => {
            setUrl(e.currentTarget.value)
            setValidationError(null)
          }}
          style={{ flex: 1 }}
          size="sm"
          leftSection={<Icon icon="lucide:rss" width={14} />}
          error={validationError}
        />
        <Button type="submit" variant="light" size="sm" loading={adding}>
          Add
        </Button>
      </form>

      <Group gap="xs" mb="xs">
        {enabledFeeds.length > 0 && (
          <>
            <Tooltip label="Export OPML">
              <ActionIcon variant="subtle" size="sm" onClick={handleOpmlExport}>
                <Icon icon="lucide:download" width={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Import OPML">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon icon="lucide:upload" width={14} />
              </ActionIcon>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept=".opml,.xml"
              onChange={handleOpmlImport}
              style={{ display: 'none' }}
            />
            <Text size="xs" c="dimmed" style={{ lineHeight: '26px' }}>|</Text>
          </>
        )}

        {enabledFeeds.map((feed) => {
          const stats = feedStats[feed.id]
          const hasError = stats && stats.errorCount > 0
          const lastFetched = stats?.lastFetched
          const statusLabel = hasError
            ? `${feed.title} — ${stats.errorCount} fetch errors`
            : lastFetched
              ? `${feed.title} — refreshed ${timeAgo(lastFetched)}`
              : feed.title
          return (
            <Tooltip key={feed.id} label={statusLabel} withArrow>
              <Badge
                variant="outline"
                size="sm"
                leftSection={
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: hasError
                        ? 'var(--mantine-color-red-6)'
                        : lastFetched
                          ? 'var(--mantine-color-green-6)'
                          : 'var(--mantine-color-gray-5)',
                      marginRight: 2,
                    }}
                  />
                }
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
            </Tooltip>
          )
        })}
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
