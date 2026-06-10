import type { SearchResult, SearchResponse, ArticleSummary, FeedResponse } from './types'

const REST_BASE = 'https://en.wikipedia.org/api/rest_v1'
const WIKI_BASE = 'https://en.wikipedia.org/w/api.php'

async function restFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Wikipedia API: HTTP ${res.status}`)
  return res.json()
}

export async function searchWikipedia(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '20',
    format: 'json',
    origin: '*',
  })
  const data = await restFetch<{
    query?: { search: Array<{ pageid: number; title: string; snippet: string }> }
  }>(`${WIKI_BASE}?${params}`, signal)

  const pages: SearchResult[] = (data.query?.search ?? []).map(item => ({
    id: item.pageid,
    key: item.title,
    title: item.title,
    excerpt: item.snippet.replace(/<\/?[^>]+(>|$)/g, ''),
    description: '',
    thumbnail: null,
  }))
  return { pages }
}

export async function fetchArticleSummary(title: string, signal?: AbortSignal): Promise<ArticleSummary> {
  return restFetch<ArticleSummary>(`${REST_BASE}/page/summary/${encodeURIComponent(title)}`, signal)
}

export async function fetchFeed(year: number, month: number, day: number, signal?: AbortSignal): Promise<FeedResponse> {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return restFetch<FeedResponse>(`${REST_BASE}/feed/featured/${year}/${mm}/${dd}`, signal)
}
