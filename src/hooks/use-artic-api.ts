import { useQuery, keepPreviousData } from '@tanstack/react-query'

interface ArticArtworkResult {
  id: number
  title: string
  artist_display: string
  image_id: string | null
}

interface ArticResponse {
  data: ArticArtworkResult[]
  pagination: {
    total: number
    limit: number
    total_pages: number
    current_page: number
  }
}

export function getArticThumbnailUrl(imageId: string): string {
  return `/iiif-proxy/2/${imageId}/full/200,/0/default.jpg`
}

export function getArticFullUrl(imageId: string): string {
  return `/iiif-proxy/2/${imageId}/full/843,/0/default.jpg`
}

async function fetchArtic(url: string): Promise<ArticResponse> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Artic API error: ${res.status}`)
  return res.json()
}

export function useArticArtworks(query: string, page: number) {
  const isSearch = query.length >= 2
  const url = isSearch
    ? `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&fields=id,title,artist_display,image_id&limit=20&page=${page}&query[exists][field]=image_id`
    : `https://api.artic.edu/api/v1/artworks?fields=id,title,artist_display,image_id&limit=20&page=${page}&query[exists][field]=image_id`

  return useQuery({
    queryKey: ['artic', isSearch ? 'search' : 'browse', query, page],
    queryFn: () => fetchArtic(url),
    placeholderData: keepPreviousData,
  })
}
