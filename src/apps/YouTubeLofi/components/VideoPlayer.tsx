import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, config: {
        height?: string
        width?: string
        videoId?: string
        playerVars?: Record<string, string | number>
        events?: {
          onReady?: () => void
          onError?: () => void
        }
      }) => {
        playVideo: () => void
        pauseVideo: () => void
        setVolume: (volume: number) => void
        destroy: () => void
      }
      PlayerState: { PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: (() => void) | null
  }
}

let apiPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise
  if (window.YT && window.YT.Player) {
    apiPromise = Promise.resolve()
    return apiPromise
  }
  apiPromise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.onerror = () => {
      apiPromise = null
      reject(new Error('Failed to load YouTube API'))
    }
    const first = document.getElementsByTagName('script')[0]
    if (first?.parentNode) {
      first.parentNode.insertBefore(tag, first)
    }
    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })
  return apiPromise
}

const API_TIMEOUT = 10000
const FALLBACK_URL = 'https://www.youtube.com/watch?v='

interface VideoPlayerProps {
  youtubeId?: string
  volume: number
  isPlaying: boolean
  onError?: () => void
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  destroy: () => void
}

export function VideoPlayer({ youtubeId, volume, isPlaying, onError }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [apiTimedOut, setApiTimedOut] = useState(false)

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        console.warn('VideoPlayer: destroy failed', e)
      }
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!youtubeId) return

    let cancelled = false
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setApiTimedOut(true)
      }
    }, API_TIMEOUT)

    loadYouTubeAPI()
      .then(() => {
        clearTimeout(timeoutId)
        if (cancelled || !containerRef.current) return
        setApiTimedOut(false)

        destroyPlayer()

        const player = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: youtubeId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            fs: 1,
          },
          events: {
            onReady: () => {
              if (cancelled) return
              if (isPlaying) {
                player.playVideo()
              }
              player.setVolume(volume * 100)
            },
            onError: () => {
              onError?.()
            },
          },
        })

        playerRef.current = player
      })
      .catch(() => {
        if (!cancelled) {
          setApiTimedOut(true)
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      destroyPlayer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- destroyPlayer is stable
  }, [youtubeId])

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume * 100)
    }
  }, [volume])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      if (isPlaying) {
        playerRef.current.playVideo()
      } else {
        playerRef.current.pauseVideo()
      }
      } catch (e) { console.warn('VideoPlayer: play/pause failed', e) }
  }, [isPlaying])

  return (
    <div className="gf-yt-player">
      {apiTimedOut ? (
        <a
          className="gf-yt-player__fallback"
          href={`${FALLBACK_URL}${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in YouTube
        </a>
      ) : (
        <div ref={containerRef} className="gf-yt-player__iframe" />
      )}
    </div>
  )
}
