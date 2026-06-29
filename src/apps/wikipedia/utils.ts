import type { WikiPage, WikiCategory, WikiLink } from './types'
import { SEARCH_LIMIT } from './shared'

const WIKI_API_BASE = (lang: string) => `https://${lang}.wikipedia.org/w/api.php`

interface ApiParams {
  [key: string]: string
}

async function wikiFetch(params: ApiParams, signal?: AbortSignal, lang = 'en'): Promise<Record<string, unknown>> {
  const url = new URL(WIKI_API_BASE(lang))
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) throw new Error(`Wikipedia API error: HTTP ${res.status}`)
  return res.json()
}

export async function searchWiki(query: string, offset = 0, signal?: AbortSignal, lang = 'en'): Promise<{ results: WikiPage[]; total: number }> {
  const data = await wikiFetch({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(SEARCH_LIMIT),
    sroffset: String(offset),
    prop: 'pageimages',
    pithumbsize: '120',
  }, signal, lang)

  const results: WikiPage[] = (data.query as { search?: WikiPage[] })?.search ?? []
  const total = (data.query as { searchinfo?: { totalhits?: number } })?.searchinfo?.totalhits ?? 0
  return { results, total }
}

export async function fetchPage(id: number, signal?: AbortSignal, lang = 'en'): Promise<WikiPage | null> {
  const data = await wikiFetch({
    action: 'query',
    pageids: String(id),
    prop: 'extracts|pageimages|categories|links',
    exintro: '1',
    explaintext: '1',
    cllimit: '10',
    pllimit: '10',
    plnamespace: '0',
  }, signal, lang)

  const pages = (data.query as { pages?: Record<string, Record<string, unknown>> })?.pages
  if (!pages) return null

  const entries = Object.values(pages)
  const raw = entries[0] ?? null
  if (!raw) return null

  const categories: WikiCategory[] = ((raw.categories as { title?: string }[]) ?? [])
    .filter((c) => !c.title?.startsWith('Category:Wikipedia'))
    .map((c) => ({ title: c.title?.replace(/^Category:/, '') ?? '' }))

  const related: WikiLink[] = ((raw.links as { title?: string; pageid?: number }[]) ?? [])
    .filter((l) => l.pageid)
    .map((l) => ({ title: l.title ?? '', pageid: l.pageid! }))
    .slice(0, 10)

  return {
    title: raw.title as string ?? '',
    pageid: raw.pageid as number ?? 0,
    snippet: '',
    extract: raw.extract as string | undefined,
    thumbnail: raw.thumbnail as { source: string } | undefined,
    categories,
    related,
  }
}

export async function fetchRandom(signal?: AbortSignal, lang = 'en'): Promise<WikiPage | null> {
  const data = await wikiFetch({
    action: 'query',
    list: 'random',
    rnlimit: '1',
    rnnamespace: '0',
    prop: 'extracts|pageimages',
    exintro: '1',
    explaintext: '1',
    pithumbsize: '200',
  }, signal, lang)

  const pages = (data.query as { random?: WikiPage[] })?.random
  const page = pages?.[0]
  if (!page?.pageid) return null

  return fetchPage(page.pageid, signal, lang)
}
