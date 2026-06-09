import type { HNCategory, HNStory, HNCache } from './types'

const CACHE_PREFIX = 'gf:hackernews:cache'
const CACHE_TTL = 5 * 60 * 1000

const ENDPOINTS: Record<HNCategory, string> = {
  top: 'https://hnrss.org/frontpage?count=30',
  new: 'https://hnrss.org/newest?count=30',
  show: 'https://hnrss.org/show?count=30',
  ask: 'https://hnrss.org/ask?count=30',
  jobs: 'https://hnrss.org/jobs?count=30',
  best: 'https://hnrss.org/best?count=30',
}

function cacheKey(category: HNCategory): string {
  return `${CACHE_PREFIX}:${category}`
}

export function getCachedStories(category: HNCategory): HNStory[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(category))
    if (!raw) return null
    const data: HNCache = JSON.parse(raw)
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey(category))
      return null
    }
    return data.stories
  } catch {
    return null
  }
}

export function setCachedStories(category: HNCategory, stories: HNStory[]): void {
  try {
    const data: HNCache = { stories, category, timestamp: Date.now() }
    localStorage.setItem(cacheKey(category), JSON.stringify(data))
  } catch {
    /* quota exceeded */
  }
}

const PROXIES: string[] = [
  'https://api.rss2json.com/v1/api.json?rss_url=',
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?url=',
]

function devProxyUrl(target: string): string {
  return `/api/rss-proxy?url=${encodeURIComponent(target)}`
}

function isDev(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

async function fetchXml(url: string): Promise<string> {
  if (isDev()) {
    const res = await fetch(devProxyUrl(url))
    if (res.ok) return res.text()
    throw new Error(`Dev proxy: HTTP ${res.status}`)
  }

  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url)
      const res = await fetch(proxyUrl)
      if (!res.ok) {
        if (res.status >= 500) continue
        throw new Error(`HTTP ${res.status}`)
      }
      const text = await res.text()

      if (proxy.includes('rss2json')) {
        const json = JSON.parse(text)
        if (json?.status === 'ok' && json?.items) {
          return reconstructRss(json)
        }
        if (json?.error) throw new Error(json.error)
        continue
      }

      if (proxy.includes('allorigins')) {
        const json = JSON.parse(text)
        if (json?.contents) return json.contents
        if (json?.error) throw new Error(json.error)
        continue
      }

      return text
    } catch (err) {
      const isLast = PROXIES.indexOf(proxy) === PROXIES.length - 1
      if (isLast) throw err
    }
  }

  throw new Error('All proxies failed')
}

function reconstructRss(json: { feed?: Record<string, unknown>; items?: Record<string, unknown>[] }): string {
  const items = (json.items || []).map(item => {
    const desc = item.description as string | undefined
    return `<item><title>${esc(String(item.title || ''))}</title><link>${esc(String(item.link || ''))}</link><description>${esc(desc || '')}</description><pubDate>${esc(String(item.pubDate || ''))}</pubDate><dc:creator>${esc(String(item.author || ''))}</dc:creator></item>`
  }).join('')
  return `<?xml version="1.0"?><rss version="2.0"><channel>${items}</channel></rss>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getChildText(parent: Element, selector: string): string {
  const el = parent.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

function extractInt(description: string, pattern: RegExp): number {
  const match = description.match(pattern)
  return match ? parseInt(match[1], 10) : 0
}

function parseDate(dateStr: string): number {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

export async function fetchStories(category: HNCategory): Promise<HNStory[]> {
  const url = ENDPOINTS[category]
  const xml = await fetchXml(url)
  const doc = new DOMParser().parseFromString(xml, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Invalid XML: ' + (parseError.textContent?.slice(0, 100) ?? ''))
  }

  const items = doc.querySelectorAll('item')
  const stories: HNStory[] = []

  items.forEach(item => {
    const description = getChildText(item, 'description')
    const guid = getChildText(item, 'guid')
    const hnId = guid.split('=').pop() || guid

    stories.push({
      id: hnId,
      title: getChildText(item, 'title') || '(no title)',
      link: getChildText(item, 'link') || '',
      commentsUrl: getChildText(item, 'comments') || '',
      score: extractInt(description, /Points:\s*(\d+)/),
      commentCount: extractInt(description, /#\s*Comments:\s*(\d+)/),
      author: getChildText(item, 'dc\\:creator') || 'anonymous',
      pubDate: getChildText(item, 'pubDate'),
      pubDateParsed: parseDate(getChildText(item, 'pubDate')),
      category,
    })
  })

  return stories
}
