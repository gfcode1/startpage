import { XMLParser } from 'fast-xml-parser'
import type { NewsArticle, FeedSource } from './types'
import { generateId } from '@/lib/utils/id'

export const MAX_ARTICLES_PER_FEED = 50

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function textContent(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (typeof obj['#text'] === 'string') return obj['#text']
  }
  return ''
}

function extractAuthor(val: unknown): string | undefined {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (typeof obj.name === 'string') return obj.name
  }
  return undefined
}

function hrefContent(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (typeof obj['@_href'] === 'string') return obj['@_href']
  }
  return ''
}

function parseRssItem(item: Record<string, unknown>, feedTitle: string, feedId: string): NewsArticle | null {
  const title = textContent(item.title)
  const link = typeof item.link === 'string' ? item.link : hrefContent(item.link) || hrefContent(item['atom:link'])
  const description = textContent(item.description) || (typeof item['content:encoded'] === 'string' ? item['content:encoded'] : '')
  const pubDate = (item.pubDate as string) || (item['dc:date'] as string) || (item.updated as string) || ''
  const author = extractAuthor(item.author) || (item['dc:creator'] as string) || (item['media:credit'] as string) || undefined
  const publishedAt = pubDate ? new Date(pubDate).getTime() : Date.now()
  const imageUrl = extractImageFromItem(item)
  const stripped = stripHtml(description)

  return {
    id: generateId(),
    feedId,
    feedTitle,
    title,
    description: stripped.slice(0, 500),
    link,
    author,
    publishedAt: Number.isNaN(publishedAt) ? Date.now() : publishedAt,
    imageUrl,
    isRead: false,
    isBookmarked: false,
    cachedAt: Date.now(),
  }
}

function parseAtomEntry(entry: Record<string, unknown>, feedTitle: string, feedId: string): NewsArticle | null {
  const title = textContent(entry.title)
  const link = typeof entry.link === 'string' ? entry.link : (() => {
    const rawLinks = entry.link
    const links = rawLinks ? (Array.isArray(rawLinks) ? rawLinks : [rawLinks]) as Record<string, string>[] : []
    const alt = links.find((l) => l['@_rel'] === 'alternate' || !l['@_rel'])
    return alt?.['@_href'] ?? links[0]?.['@_href'] ?? ''
  })()
  const description = (entry.summary as string) || (typeof entry.content === 'string' ? entry.content as string : '') || (entry['media:description'] as string) || ''
  const published = (entry.published as string) || (entry.updated as string) || ''
  const publishedAt = published ? new Date(published).getTime() : Date.now()
  const author = extractAuthor(entry.author)
  const imageUrl = extractImageFromItem(entry)
  const stripped = stripHtml(description)

  return {
    id: generateId(),
    feedId,
    feedTitle,
    title,
    description: stripped.slice(0, 500),
    link,
    author,
    publishedAt: Number.isNaN(publishedAt) ? Date.now() : publishedAt,
    imageUrl,
    isRead: false,
    isBookmarked: false,
    cachedAt: Date.now(),
  }
}

function extractImageFromItem(item: Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure
  if (typeof enclosure === 'object' && enclosure !== null) {
    const enc = enclosure as Record<string, string>
    if (typeof enc['@_type'] === 'string' && enc['@_type'].startsWith('image')) return enc['@_url']
  }

  const mc = item['media:content']
  if (mc) {
    const items = Array.isArray(mc) ? mc as Record<string, unknown>[] : [mc as Record<string, unknown>]
    for (const m of items) {
      if (m['@_type'] === 'image' || m['@_medium'] === 'image') {
        if (typeof m['@_url'] === 'string') return m['@_url']
      }
    }
  }

  const mt = item['media:thumbnail']
  if (mt) {
    const thumbs = Array.isArray(mt) ? mt as Record<string, unknown>[] : [mt as Record<string, unknown>]
    if (typeof thumbs[0]?.['@_url'] === 'string') return thumbs[0]['@_url']
  }

  if (typeof item.description === 'string') {
    const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/)
    if (imgMatch) return imgMatch[1]
  }

  return undefined
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).trim()
}

function parseFeedXml(xml: string, feed: FeedSource): NewsArticle[] {
  let parsed: { rss?: { channel?: unknown }; feed?: { entry?: unknown; title?: string } }
  try {
    parsed = parser.parse(xml)
  } catch {
    return []
  }

  const feedTitle = feed.title

  if (parsed.rss?.channel) {
    const channels = toArray(parsed.rss.channel) as Record<string, unknown>[]
    const items: NewsArticle[] = []
    for (const ch of channels) {
      const channelTitle = (ch.title as string) ?? feedTitle
      const rawItems = toArray(ch.item) as Record<string, unknown>[]
      for (const raw of rawItems) {
        const article = parseRssItem(raw, channelTitle, feed.id)
        if (article) items.push(article)
      }
    }
    return items
  }

  if (parsed.feed) {
    const feedTitleAtom = (parsed.feed.title as string) ?? feedTitle
    const entries = toArray(parsed.feed.entry) as Record<string, unknown>[]
    const items: NewsArticle[] = []
    for (const entry of entries) {
      const article = parseAtomEntry(entry, feedTitleAtom, feed.id)
      if (article) items.push(article)
    }
    return items
  }

  return []
}

async function tryDirectXml(url: string): Promise<string | null> {
  try {
    const viaProxy = `/rss-fetch?url=${encodeURIComponent(url)}`
    const res = await fetch(viaProxy)
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

export async function fetchAndParseFeed(feed: FeedSource): Promise<NewsArticle[]> {
  const xml = await tryDirectXml(feed.url)
  if (xml) {
    const articles = parseFeedXml(xml, feed)
    if (articles.length > 0) return articles
  }

  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`
  let text: string | null = null
  try {
    const res = await fetch(apiUrl)
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 3000))
      const retryRes = await fetch(apiUrl)
      if (retryRes.ok) text = await retryRes.text()
    } else if (res.ok) {
      text = await res.text()
    }
  } catch { /* network */ }
  if (!text) return []

  try {
    const data = JSON.parse(text) as Record<string, unknown>
    if (data.status !== 'ok') return []
    const feedTitle = ((data.feed as Record<string, string> | undefined)?.title) ?? feed.title
    const items = (data.items as Array<Record<string, string>>) ?? []
    return items.map((item) => ({
      id: generateId(),
      feedId: feed.id,
      feedTitle,
      title: item.title || '',
      description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
      link: item.link || '',
      author: item.author || undefined,
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
      imageUrl: (() => {
        const enc = item.enclosure
        if (typeof enc === 'string') return enc
        if (enc && typeof enc === 'object') return (enc as Record<string, string>).link || undefined
        return item.thumbnail || undefined
      })(),
      isRead: false,
      isBookmarked: false,
      cachedAt: Date.now(),
    })).filter((a) => a.link || a.title)
  } catch {
    return []
  }
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function uniqueByLink(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  return articles.filter((a) => {
    if (seen.has(a.link)) return false
    seen.add(a.link)
    return true
  })
}

export function getFeedTitleFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 40)
  }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
