import { useState, useEffect, useCallback } from 'react'

const IMG_SIZE = 800
const FETCH_TIMEOUT = 10000
const PAGE_LIMIT = 60
const MAX_PAGE = 20

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomPage(): number {
  return Math.floor(Math.random() * MAX_PAGE) + 1
}

export interface PhotoInfo {
  id: string
  author: string
  downloadUrl: string
}

async function fetchPicsumPage(pageNum: number): Promise<{ mapped: PhotoInfo[]; count: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(`https://picsum.photos/v2/list?page=${pageNum}&limit=${PAGE_LIMIT}`, { signal: controller.signal })
    const data: { id: number; author: string }[] = await res.json()
    return {
      mapped: data.map(p => ({
        id: String(p.id),
        author: p.author,
        downloadUrl: `https://picsum.photos/id/${p.id}/${IMG_SIZE}/${IMG_SIZE}`,
      })),
      count: data.length,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function usePhotoFetcher() {
  const [apiPhotos, setApiPhotos] = useState<PhotoInfo[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiHasMore, setApiHasMore] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPicsumPage(randomPage())
      .then(({ mapped }) => {
        if (cancelled) return
        setApiPhotos(shuffle(mapped))
        setApiLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setApiError(true)
        setApiLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const loadMore = useCallback(() => {
    if (loadingMore) return
    setLoadingMore(true)
    fetchPicsumPage(randomPage())
      .then(({ mapped }) => {
        setApiPhotos(prev => [...prev, ...shuffle(mapped)])
        setLoadingMore(false)
      })
      .catch(() => setLoadingMore(false))
  }, [loadingMore])

  const retry = useCallback(() => {
    setApiPhotos([])
    setApiHasMore(true)
    setApiLoading(true)
    setApiError(false)
    fetchPicsumPage(randomPage())
      .then(({ mapped }) => {
        setApiPhotos(shuffle(mapped))
        setApiLoading(false)
      })
      .catch(() => {
        setApiError(true)
        setApiLoading(false)
      })
  }, [])

  return {
    photos: apiPhotos,
    loading: apiLoading,
    error: apiError,
    loadMore,
    loadingMore,
    hasMore: apiHasMore,
    retry,
  }
}
