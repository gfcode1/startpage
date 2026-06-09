import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

const IMG_SIZE = 800
const FETCH_TIMEOUT = 10000
const TOPIC_COUNT = 30

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

function generateTopicPhotos(topic: string): PhotoInfo[] {
  const result: PhotoInfo[] = []
  for (let i = 0; i < TOPIC_COUNT; i++) {
    result.push({
      id: `topic-${topic}-${i}`,
      author: topic,
      downloadUrl: `https://picsum.photos/seed/${encodeURIComponent(topic)}${i}/${IMG_SIZE}/${IMG_SIZE}`,
    })
  }
  return result
}

export function usePhotoFetcher() {
  const [apiPhotos, setApiPhotos] = useState<PhotoInfo[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiHasMore, setApiHasMore] = useState(true)
  const pageRef = useRef(1)

  const isTopicSearch = searchQuery.trim().length > 0

  const topicPhotos = useMemo(() => {
    const q = searchQuery.trim()
    return q ? generateTopicPhotos(q) : null
  }, [searchQuery])

  const photos = topicPhotos ?? apiPhotos
  const loading = isTopicSearch ? false : apiLoading
  const error = isTopicSearch ? false : apiError
  const hasMore = isTopicSearch ? false : apiHasMore

  useEffect(() => {
    if (topicPhotos) return

    let cancelled = false
    pageRef.current = 1
    fetchPicsumPage(1)
      .then(({ mapped, count }) => {
        if (cancelled) return
        setApiPhotos(mapped)
        setApiLoading(false)
        if (count < 30) setApiHasMore(false)
      })
      .catch(() => {
        if (cancelled) return
        setApiError(true)
        setApiLoading(false)
      })
    return () => { cancelled = true }
  }, [topicPhotos])

  const loadMore = useCallback(() => {
    if (isTopicSearch || loadingMore) return
    pageRef.current += 1
    setLoadingMore(true)
    fetchPicsumPage(pageRef.current)
      .then(({ mapped, count }) => {
        setApiPhotos(prev => [...prev, ...mapped])
        setLoadingMore(false)
        if (count < 30) setApiHasMore(false)
      })
      .catch(() => setLoadingMore(false))
  }, [isTopicSearch, loadingMore])

  const retry = useCallback(() => {
    if (isTopicSearch) return
    pageRef.current = 1
    setApiPhotos([])
    setApiHasMore(true)
    setApiLoading(true)
    setApiError(false)
    fetchPicsumPage(1)
      .then(({ mapped, count }) => {
        setApiPhotos(mapped)
        setApiLoading(false)
        if (count < 30) setApiHasMore(false)
      })
      .catch(() => {
        setApiError(true)
        setApiLoading(false)
      })
  }, [isTopicSearch])

  return {
    photos,
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
