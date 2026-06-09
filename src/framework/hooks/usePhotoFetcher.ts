import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

const IMG_SIZE = 800
const FETCH_TIMEOUT = 10000

export interface PhotoInfo {
  id: string
  author: string
  downloadUrl: string
}

async function fetchPicsumPage(pageNum: number): Promise<{ mapped: PhotoInfo[]; count: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(`https://picsum.photos/v2/list?page=${pageNum}&limit=30`, { signal: controller.signal })
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
  const [allPhotos, setAllPhotos] = useState<PhotoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)

  useEffect(() => {
    let cancelled = false
    fetchPicsumPage(1)
      .then(({ mapped, count }) => {
        if (cancelled) return
        setAllPhotos(mapped)
        setLoading(false)
        if (count < 30) setHasMore(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const loadMore = useCallback(() => {
    pageRef.current += 1
    setLoadingMore(true)
    fetchPicsumPage(pageRef.current)
      .then(({ mapped, count }) => {
        setAllPhotos(prev => [...prev, ...mapped])
        setLoadingMore(false)
        if (count < 30) setHasMore(false)
      })
      .catch(() => setLoadingMore(false))
  }, [])

  const retry = useCallback(() => {
    pageRef.current = 1
    setAllPhotos([])
    setHasMore(true)
    setLoading(true)
    setError(false)
    fetchPicsumPage(1)
      .then(({ mapped, count }) => {
        setAllPhotos(mapped)
        setLoading(false)
        if (count < 30) setHasMore(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return allPhotos
    const q = searchQuery.toLowerCase()
    return allPhotos.filter(p => p.author.toLowerCase().includes(q))
  }, [allPhotos, searchQuery])

  return {
    photos: filteredPhotos,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    loadMore,
    loadingMore,
    hasMore,
    retry,
  }
}
