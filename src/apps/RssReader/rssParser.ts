import { Readability } from '@mozilla/readability'
import type { Article, FeedInfo, FeedResult } from './types'

const PROXIES: string[] = [
  'https://api.rss2json.com/v1/api.json?rss_url=',
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?url=',
]

function devProxyUrl(target: string): string {
  return `/api/rss-proxy?url=${encodeURIComponent(decodeURIComponent(target))}`
}

function isDev(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function parseDate(dateStr: string): number {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

async function fetchViaProxy(url: string, signal?: AbortSignal): Promise<string> {
  if (isDev()) {
    const res = await fetch(devProxyUrl(url), { signal })
    if (res.ok) return res.text()
    throw new Error(`Dev proxy: HTTP ${res.status}`)
  }

  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url)
      const res = await fetch(proxyUrl, { signal })

      if (!res.ok) {
        if (res.status >= 500) continue
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const text = await res.text()

      if (proxy.includes('rss2json')) {
        const json = JSON.parse(text)
        if (json?.status === 'ok' && json?.feed) {
          return json.feed.title
            ? `<?xml version="1.0"?><rss version="2.0"><channel><title>${escapeXml(json.feed.title)}</title><description>${escapeXml(json.feed.description || '')}</description>${(json.items || []).map((item: Record<string, string | undefined>) => `<item><title>${escapeXml(item.title || '')}</title><link>${escapeXml(item.link || '')}</link><description>${escapeXml(item.description || '')}</description><pubDate>${escapeXml(item.pubDate || '')}</pubDate></item>`).join('')}</channel></rss>`
            : text
        }
        if (json?.error) throw new Error(json.error)
        throw new Error('Invalid rss2json response')
      }

      if (proxy.includes('allorigins')) {
        const json = JSON.parse(text)
        if (json?.contents) return json.contents
        if (json?.error) throw new Error(json.error)
        throw new Error('Invalid proxy response')
      }

      return text
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      const isLast = PROXIES.indexOf(proxy) === PROXIES.length - 1
      if (isLast) throw err
    }
  }

  throw new Error('All proxies failed')
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function cleanHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getChildText(parent: Element, selector: string): string {
  const el = parent.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

function extractEnclosureThumbnail(item: Element): string | undefined {
  const enclosure = item.querySelector('enclosure')
  const type = enclosure?.getAttribute('type') ?? ''
  if (type.startsWith('image/')) {
    return enclosure!.getAttribute('url') ?? undefined
  }

  const mediaContent = item.querySelector('media\\:content, content')
  if (mediaContent) {
    const url = mediaContent.getAttribute('url')
    if (url && (mediaContent.getAttribute('type') ?? '').startsWith('image/')) {
      return url
    }
  }

  const mediaThumbnail = item.querySelector('media\\:thumbnail')
  if (mediaThumbnail) {
    return mediaThumbnail.getAttribute('url') ?? undefined
  }

  return undefined
}

function parseRss(doc: Document, url: string): { feed: FeedInfo; articles: Article[] } {
  const channel = doc.querySelector('channel')
  if (!channel) throw new Error('Invalid RSS: no <channel> found')

  const feed: FeedInfo = {
    title: getChildText(channel, 'title') || url,
    description: getChildText(channel, 'description'),
    link: getChildText(channel, 'link'),
    url,
  }

  const items = channel.querySelectorAll('item')
  const articles: Article[] = []

  items.forEach(item => {
    const link = getChildText(item, 'link') || ''
    if (!link) return

    articles.push({
      id: link,
      feedTitle: feed.title,
      feedUrl: url,
      title: getChildText(item, 'title') || '(no title)',
      link,
      description: cleanHtml(getChildText(item, 'description')),
      pubDate: getChildText(item, 'pubDate'),
      pubDateParsed: parseDate(getChildText(item, 'pubDate')),
      mediaThumbnail: extractEnclosureThumbnail(item),
    })
  })

  return { feed, articles }
}

function parseAtom(doc: Document, url: string): { feed: FeedInfo; articles: Article[] } {
  const feedEl = doc.querySelector('feed')
  if (!feedEl) throw new Error('Invalid Atom: no <feed> found')

  const feedTitleEl = feedEl.querySelector('title')
  const feed: FeedInfo = {
    title: feedTitleEl?.textContent?.trim() || url,
    description: '',
    link: feedEl.querySelector('link[rel="alternate"]')?.getAttribute('href')
      || feedEl.querySelector('link')?.getAttribute('href')
      || '',
    url,
  }

  const entries = feedEl.querySelectorAll('entry')
  const articles: Article[] = []

  entries.forEach(entry => {
    const linkEl = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link')
    const link = linkEl?.getAttribute('href') ?? ''
    if (!link) return

    const titleEl = entry.querySelector('title')
    const contentEl = entry.querySelector('content')
    const summaryEl = entry.querySelector('summary')
    const publishedEl = entry.querySelector('published') || entry.querySelector('updated')
    const pubDateStr = publishedEl?.textContent?.trim() ?? ''

    articles.push({
      id: link,
      feedTitle: feed.title,
      feedUrl: url,
      title: titleEl?.textContent?.trim() || '(no title)',
      link,
      description: cleanHtml(
        summaryEl?.textContent?.trim() ?? contentEl?.textContent?.trim() ?? ''
      ),
      pubDate: pubDateStr,
      pubDateParsed: parseDate(pubDateStr),
    })
  })

  return { feed, articles }
}

export async function fetchAndParseArticle(url: string): Promise<{
  title: string
  content: string
  excerpt: string
  byline: string | null
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  const html = await fetchViaProxy(url, controller.signal)
  clearTimeout(timeout)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const reader = new Readability(doc)
  const article = reader.parse()
  if (!article) throw new Error('Readability could not parse this page')
  return {
    title: article.title || '',
    content: article.content || '',
    excerpt: article.excerpt || '',
    byline: article.byline ?? null,
  }
}

export async function fetchAndParseFeed(url: string): Promise<FeedResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const xml = await fetchViaProxy(url, controller.signal)
    clearTimeout(timeout)
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      throw new Error('Invalid XML: ' + (parseError.textContent?.slice(0, 100) ?? ''))
    }

    const isAtom = doc.querySelector('feed') !== null
    const result = isAtom ? parseAtom(doc, url) : parseRss(doc, url)

    result.articles.sort((a, b) => b.pubDateParsed - a.pubDateParsed)

    return { ...result, error: undefined }
  } catch (err) {
    return {
      feed: { title: url, description: '', link: '', url },
      articles: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
