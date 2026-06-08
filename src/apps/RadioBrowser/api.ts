import type { RadioStation, Tag, Country, ClickResponse } from './types'

export const API_BASE = 'https://de1.api.radio-browser.info'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

async function apiRequest<T>(url: string, options?: RequestInit & { externalSignal?: AbortSignal }): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  if (options?.externalSignal) {
    options.externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const directHeaders: Record<string, string> = {
      ...(options?.headers as Record<string, string> || {}),
      'User-Agent': 'GFCode/1.0',
    }
    const res = await fetch(url, { ...options, headers: directHeaders, signal: controller.signal })
    if (res.ok) return res.json()
  } catch (e) {
    console.warn('RadioBrowser: direct fetch failed, falling back to proxy', e)
  }

  const proxyUrl = CORS_PROXY + encodeURIComponent(url)
  const proxyHeaders: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  }
  delete proxyHeaders['User-Agent']
  const res = await fetch(proxyUrl, {
    ...options,
    headers: Object.keys(proxyHeaders).length > 0 ? proxyHeaders : undefined,
    signal: controller.signal,
  })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

function apiFetch<T>(path: string, params?: Record<string, string | number | boolean>, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v))
    }
  }
  return apiRequest<T>(url.toString(), { externalSignal: signal })
}

function apiPost<T>(path: string, body: Record<string, string | number | boolean>, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  return apiRequest<T>(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    externalSignal: signal,
  })
}

export async function fetchTopTags(limit = 20, signal?: AbortSignal): Promise<Tag[]> {
  return apiFetch<Tag[]>('/json/tags', { order: 'stationcount', reverse: true, limit, hidebroken: true }, signal)
}

export async function fetchCountries(limit = 30, signal?: AbortSignal): Promise<Country[]> {
  return apiFetch<Country[]>('/json/countries', { order: 'stationcount', reverse: true, limit, hidebroken: true }, signal)
}

export async function searchStations(opts: {
  name?: string
  tag?: string
  countrycode?: string
  limit?: number
}, signal?: AbortSignal): Promise<RadioStation[]> {
  const params: Record<string, string | number | boolean> = {
    order: 'clickcount',
    reverse: true,
    limit: opts.limit ?? 50,
    hidebroken: true,
  }

  let hasFilter = false
  if (opts.name) { params.name = opts.name; hasFilter = true }
  if (opts.tag) { params.tag = opts.tag; hasFilter = true }
  if (opts.countrycode) { params.countrycode = opts.countrycode; hasFilter = true }

  if (hasFilter) {
    return apiPost<RadioStation[]>('/json/stations/search', params, signal)
  }

  return apiFetch<RadioStation[]>('/json/stations', params, signal)
}

export async function clickStation(uuid: string, signal?: AbortSignal): Promise<ClickResponse | null> {
  try {
    return await apiRequest<ClickResponse>(`${API_BASE}/json/url/${uuid}`, { externalSignal: signal })
  } catch (e) {
    console.warn('RadioBrowser: clickStation failed', e)
    return null
  }
}

export async function fetchStationsByUuid(uuids: string[], signal?: AbortSignal): Promise<RadioStation[]> {
  if (uuids.length === 0) return []
  return apiFetch<RadioStation[]>(
    '/json/stations/byuuid',
    { uuids: uuids.join(',') },
    signal,
  )
}

export function isHlsStream(station: RadioStation): boolean {
  if (station.hls === 1) return true
  const url = (station.url_resolved || station.url || '').toLowerCase()
  return url.endsWith('.m3u8')
}
