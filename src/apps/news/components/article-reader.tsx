import { useEffect, useState, useRef } from 'react'
import { Container, Text, Group, Paper, ActionIcon, Loader, Center, Alert, SegmentedControl, Text as MText } from '@mantine/core'
import { Icon } from '@iconify/react'
import { Readability } from '@mozilla/readability'
import { useNewsStore } from '@/stores/news-store'
import { formatDate } from '../utils'

export function ArticleReader() {
  const activeArticle = useNewsStore((s) => s.activeArticle)
  const setActiveArticle = useNewsStore((s) => s.setActiveArticle)
  const readerSettings = useNewsStore((s) => s.readerSettings)
  const setReaderSettings = useNewsStore((s) => s.setReaderSettings)
  const markAsRead = useNewsStore((s) => s.markAsRead)
  const toggleBookmark = useNewsStore((s) => s.toggleBookmark)

  const [fetchState, setFetchState] = useState<{ status: 'loading' | 'done' | 'error'; content: string | null }>({ status: 'loading', content: null })
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!activeArticle) return
    markAsRead(activeArticle.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetchState({ status: 'loading', content: null })

    let cancelled = false
    fetch(`/article-proxy?url=${encodeURIComponent(activeArticle.link)}`)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const reader = new Readability(doc)
        const result = reader.parse()
        if (!cancelled) {
          setFetchState({ status: 'done', content: result?.content ?? null })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchState({ status: 'error', content: null })
        }
      })
    return () => { cancelled = true }
  }, [activeArticle, markAsRead])

  const { status: fetchStatus, content: extracted } = fetchState
  const loading = fetchStatus === 'loading'
  const fetchError = fetchStatus === 'error' ? 'Could not load article content' : null

  if (!activeArticle) return null

  const fontSizeMap = { sm: '0.875rem', md: '1rem', lg: '1.125rem' }
  const fontFamilyMap = { sans: 'var(--mantine-font-family)', serif: 'Georgia, serif', mono: 'var(--mantine-font-family-monospace)' }
  const themeBgMap = { light: '#ffffff', sepia: '#f8f0e0', dark: '#1a1a1a' }
  const themeTextMap = { light: '#1a1a1a', sepia: '#433422', dark: '#e0e0e0' }

  return (
    <Container size="md" py="md">
      <Group mb="md" justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setActiveArticle(null)}>
            <Icon icon="lucide:arrow-left" width={18} />
          </ActionIcon>
          <Text fw={700} size="sm" truncate="end" style={{ maxWidth: 300 }}>
            {activeArticle.title}
          </Text>
        </Group>

        <Group gap="xs">
          <ActionIcon
            variant={activeArticle.isBookmarked ? 'filled' : 'subtle'}
            size="sm"
            onClick={() => toggleBookmark(activeArticle.id)}
          >
            <Icon icon="lucide:bookmark" width={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="sm"
            component="a"
            href={activeArticle.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon="lucide:external-link" width={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Paper withBorder p="xs" mb="md" radius="md">
        <Group gap="xs">
          <SegmentedControl
            size="xs"
            value={readerSettings.theme}
            onChange={(v) => setReaderSettings({ ...readerSettings, theme: v as 'light' | 'sepia' | 'dark' })}
            data={[
              { label: 'Light', value: 'light' },
              { label: 'Sepia', value: 'sepia' },
              { label: 'Dark', value: 'dark' },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={readerSettings.fontSize}
            onChange={(v) => setReaderSettings({ ...readerSettings, fontSize: v as 'sm' | 'md' | 'lg' })}
            data={[
              { label: 'S', value: 'sm' },
              { label: 'M', value: 'md' },
              { label: 'L', value: 'lg' },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={readerSettings.fontFamily}
            onChange={(v) => setReaderSettings({ ...readerSettings, fontFamily: v as 'sans' | 'serif' | 'mono' })}
            data={[
              { label: 'Sans', value: 'sans' },
              { label: 'Serif', value: 'serif' },
              { label: 'Mono', value: 'mono' },
            ]}
          />
        </Group>
      </Paper>

      {loading && (
        <Center py="xl">
          <Loader />
          <MText size="sm" c="dimmed" ml="sm">Loading article...</MText>
        </Center>
      )}

      {fetchError && (
        <Alert color="red" title="Error">{fetchError}</Alert>
      )}

      {extracted && (
        <Paper
          p="xl"
          radius="md"
          style={{
            background: themeBgMap[readerSettings.theme],
            color: themeTextMap[readerSettings.theme],
            fontSize: fontSizeMap[readerSettings.fontSize],
            fontFamily: fontFamilyMap[readerSettings.fontFamily],
            lineHeight: 1.8,
          }}
        >
          <Text
            size="xl"
            fw={700}
            mb="xs"
            style={{ fontFamily: fontFamilyMap[readerSettings.fontFamily], color: 'inherit' }}
          >
            {activeArticle.title}
          </Text>

          <Group gap="xs" mb="lg">
            {typeof activeArticle.author === 'string' && (
              <MText size="sm" style={{ color: 'inherit', opacity: 0.7 }}>By {activeArticle.author}</MText>
            )}
            <MText size="sm" style={{ color: 'inherit', opacity: 0.5 }}>
              {formatDate(activeArticle.publishedAt)}
            </MText>
            <MText size="sm" style={{ color: 'inherit', opacity: 0.5 }}>·</MText>
            <MText size="sm" style={{ color: 'inherit', opacity: 0.5 }}>{activeArticle.feedTitle}</MText>
          </Group>

          <div
            className="news-reader-content"
            dangerouslySetInnerHTML={{ __html: extracted }}
            style={{ color: 'inherit' }}
          />
        </Paper>
      )}

      {!loading && !fetchError && !extracted && (
        <Paper p="lg" radius="md" style={{ height: '70vh' }}>
          <iframe
            ref={iframeRef}
            src={activeArticle.link}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 'var(--mantine-radius-md)',
            }}
            title={activeArticle.title}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </Paper>
      )}
    </Container>
  )
}
