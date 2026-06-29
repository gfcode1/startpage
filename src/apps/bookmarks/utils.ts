import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Bookmark, Collection, SortField, SortOrder } from './types'

const DATA_KEY = 'bookmarks:data'

export interface PersistedData {
  collections: Collection[]
  bookmarks: Bookmark[]
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'col-default', name: 'General', parentId: null, icon: 'lucide:folder', color: '#636363', order: 0, createdAt: Date.now() },
]

export function loadData(): PersistedData {
  const storage = getStorage()
  const data = storage.get<PersistedData>(DATA_KEY)
  if (data?.collections && data?.bookmarks) return data
  return { collections: DEFAULT_COLLECTIONS, bookmarks: [] }
}

export function saveData(data: PersistedData): void {
  getStorage().set(DATA_KEY, data)
}

export function createCollection(name: string, parentId: string | null = null, order = 0): Collection {
  return {
    id: generateId(),
    name: name.trim() || 'Untitled',
    parentId,
    icon: 'lucide:folder',
    color: '#636363',
    order,
    createdAt: Date.now(),
  }
}

export function createBookmark(url: string, title = '', description = ''): Bookmark {
  return {
    id: generateId(),
    url: url.trim(),
    title: title.trim() || new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
    description: description.trim(),
    favicon: getFaviconUrl(url),
    ogImage: '',
    collectionId: null,
    tags: [],
    notes: '',
    isReadLater: false,
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const origin = url.startsWith('http') ? new URL(url).origin : `https://${url.split('/')[0]}`
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
  } catch {
    return ''
  }
}

export function getFaviconUrlWithFallback(url: string, index = 0): string {
  try {
    const origin = url.startsWith('http') ? new URL(url).origin : `https://${url.split('/')[0]}`
    const providers = [
      `https://www.google.com/s2/favicons?domain=${origin}&sz=32`,
      `https://icons.duckduckgo.com/ip3/${new URL(url.startsWith('http') ? url : `https://${url}`).hostname}.ico`,
      `${origin}/favicon.ico`,
    ] as const
    if (index >= 0 && index < providers.length) return providers[index]!
    return providers[0]!
  } catch {
    return ''
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 2) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export async function fetchMetadata(url: string): Promise<{ title: string; description: string; favicon: string; ogImage: string }> {
  const result = { title: '', description: '', favicon: '', ogImage: '' }

  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return result

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) return result

    const getMeta = (name: string): string => {
      const el = doc.querySelector(`meta[name="${name}"]`) ?? doc.querySelector(`meta[property="${name}"]`)
      return el?.getAttribute('content') ?? ''
    }

    result.title = doc.title || ''
    result.description = getMeta('description') || getMeta('og:description') || ''
    result.favicon = doc.querySelector('link[rel*="icon"]')?.getAttribute('href') || ''
    result.ogImage = getMeta('og:image') || ''

    if (result.favicon && !result.favicon.startsWith('http')) {
      try {
        result.favicon = new URL(result.favicon, fullUrl).href
      } catch { /* keep as is */ }
    }
    if (result.ogImage && !result.ogImage.startsWith('http')) {
      try {
        result.ogImage = new URL(result.ogImage, fullUrl).href
      } catch { /* keep as is */ }
    }
  } catch {
    /* silent fail */
  }

  return result
}

export function compareBookmarks(a: Bookmark, b: Bookmark, field: SortField, order: SortOrder): number {
  const dir = order === 'asc' ? 1 : -1
  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title) * dir
    case 'url':
      return a.url.localeCompare(b.url) * dir
    case 'createdAt':
      return (a.createdAt - b.createdAt) * dir
    case 'updatedAt':
    default:
      return (a.updatedAt - b.updatedAt) * dir
  }
}

export function getChildCollectionIds(collections: Collection[], parentId: string): string[] {
  const ids: string[] = [parentId]
  for (const c of collections) {
    if (c.parentId === parentId) {
      ids.push(...getChildCollectionIds(collections, c.id))
    }
  }
  return ids
}

export function parseBrowserBookmarksHtml(html: string): { bookmarks: Bookmark[]; collections: Collection[] } {
  const collections: Collection[] = []
  const bookmarks: Bookmark[] = []
  const collectionMap = new Map<string, { id: string; name: string; parentId: string | null }>()

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  if (!doc) return { bookmarks, collections }

  function walkNodes(node: Element, parentCollectionId: string | null) {
    for (const dt of Array.from(node.querySelectorAll(':scope > dl > dt'))) {
      const h3 = dt.querySelector('h3')
      if (h3) {
        const dl = dt.querySelector('dl')
        if (dl) {
          const id = generateId()
          collectionMap.set(id, { id, name: h3.textContent?.trim() || 'Untitled', parentId: parentCollectionId })
          walkNodes(dl, id)
        }
      } else {
        const a = dt.querySelector('a[href]')
        if (a) {
          const href = a.getAttribute('href') || ''
          const title = a.textContent?.trim() || ''
          const addDate = a.getAttribute('add_date')
          const favicon = a.getAttribute('icon') || ''
          const tags = a.getAttribute('tags') || ''
          bookmarks.push({
            id: generateId(),
            url: href,
            title,
            description: '',
            favicon: favicon || getFaviconUrl(href),
            ogImage: '',
            collectionId: parentCollectionId,
            tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            notes: '',
            isReadLater: false,
            isFavorite: false,
            createdAt: addDate ? Number(addDate) * 1000 : Date.now(),
            updatedAt: Date.now(),
          })
        }
      }
    }
  }

  const body = doc.querySelector('body')
  if (body) walkNodes(body, null)

  let order = 0
  for (const [id, info] of collectionMap) {
    collections.push({
      id,
      name: info.name,
      parentId: info.parentId,
      icon: 'lucide:folder',
      color: '#636363',
      order: order++,
      createdAt: Date.now(),
    })
  }

  return { bookmarks, collections }
}

export function exportAsJson(data: PersistedData): string {
  return JSON.stringify(data, null, 2)
}

export function exportAsHtml(data: PersistedData): string {
  let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n'
  html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n'
  html += '<TITLE>Bookmarks</TITLE>\n'
  html += '<H1>Bookmarks</H1>\n'
  html += '<DL><p>\n'

  function writeCollection(collectionId: string | null, indent: string) {
    const children = data.collections.filter((c) => c.parentId === collectionId).sort((a, b) => a.order - b.order)
    const colBookmarks = data.bookmarks.filter((b) => b.collectionId === collectionId)

    for (const col of children) {
      html += `${indent}<DT><H3>${escapeHtml(col.name)}</H3>\n`
      html += `${indent}<DL><p>\n`
      writeCollection(col.id, indent + '    ')
      html += `${indent}</DL><p>\n`
    }

    for (const bm of colBookmarks) {
      const tags = bm.tags.length ? ` TAGS="${escapeAttr(bm.tags.join(','))}"` : ''
      html += `${indent}<DT><A HREF="${escapeAttr(bm.url)}"${tags}>${escapeHtml(bm.title)}</A>\n`
    }
  }

  writeCollection(null, '  ')
  html += '</DL><p>\n'
  return html
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
