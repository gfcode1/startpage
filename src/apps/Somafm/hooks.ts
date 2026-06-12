import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Channel } from './types'
import { parseStreamUrl } from './streamUrl'
import { usePlayer } from '../../framework/PlayerContext'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { useTopbar } from '../../framework/TopbarContext'
import type { QualityPreference } from './streamUrl'
import channelData from './data/channels.json'
import { fetchChannelsWithFallback } from './api'

const APP_ID = 'somafm'

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

export function useChannels() {
  const [liveChannels, setLiveChannels] = useState<Channel[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const abort = new AbortController()

    fetchChannelsWithFallback(abort.signal)
      .then(data => {
        if (!abort.signal.aborted) {
          setLiveChannels(data)
          setLoading(false)
        }
      })
      .catch(_err => {
        if (!abort.signal.aborted) {
          setLoadError('Failed to load channels')
          setLoading(false)
        }
      })

    return () => abort.abort()
  }, [])

  const channels = useMemo(() => {
    const source = liveChannels ?? (channelData as Channel[])
    return [...source].sort((a, b) => b.listeners - a.listeners)
  }, [liveChannels])

  const genres = useMemo(() => {
    const seen = new Set<string>()
    const all = channels.flatMap((c: Channel) => c.genre.split('|'))
    all.forEach((g: string) => seen.add(g))
    return ['all', ...Array.from(seen).sort()]
  }, [channels])

  return { channels, genres, loading, loadError }
}

export function useChannelFiltering(channels: Channel[], genres: string[]) {
  const [genreFilter, setGenreFilter] = useAppStorage<string>(APP_ID, 'genreFilter', 'all')
  const [search, setSearch] = useAppStorage<string>(APP_ID, 'search', '')
  const { setSearch: setTopbarSearch, clearConfig } = useTopbar()

  useEffect(() => {
    setTopbarSearch({ placeholder: 'Search channel...', value: search, onChange: setSearch })
    return () => { clearConfig() }
  }, [search, setTopbarSearch, clearConfig, setSearch])

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchGenre = genreFilter === 'all' || c.genre.split('|').includes(genreFilter)
      const matchSearch = !search
        || c.title.toLowerCase().includes(search.toLowerCase())
        || c.description.toLowerCase().includes(search.toLowerCase())
      return matchGenre && matchSearch
    })
  }, [channels, genreFilter, search])

  const genreSegments = useMemo(() => genres.map((g: string) => ({
    value: g,
    label: g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1),
  })), [genres])

  return { genreFilter, setGenreFilter, search, setSearch, filteredChannels, genreSegments }
}

export function useFavorites() {
  return useAppStorage<string[]>(APP_ID, 'favorites', [])
}

export function useQualityPreference() {
  return useAppStorage<QualityPreference>(APP_ID, 'quality', 'highest')
}

export function useSomaFMPlayer() {
  const player = usePlayer()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerTypeRef = useRef(player.type)
  const [playError, setPlayError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    playerTypeRef.current = player.type
  }, [player.type])

  const cleanupAudio = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleAudioError = () => {
      retryCountRef.current += 1
      if (retryCountRef.current <= MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCountRef.current - 1]
        player.setLoading(true)
        retryTimerRef.current = setTimeout(() => {
          if (audioRef.current && audioRef.current.src) {
            audioRef.current.load()
            audioRef.current.play()
              .then(() => {
                player.setPlaying(true)
                player.setLoading(false)
                retryCountRef.current = 0
              })
              .catch(() => {
                if (retryCountRef.current >= MAX_RETRIES) {
                  player.stop()
                  setPlayError('Stream lost. Unable to reconnect.')
                }
              })
          }
        }, delay)
      } else {
        player.stop()
        setPlayError('Stream lost. Unable to reconnect.')
      }
    }

    audio.addEventListener('error', handleAudioError)

    return () => {
      audio.removeEventListener('error', handleAudioError)
      cleanupAudio()
      audioRef.current = null
      if (playerTypeRef.current === 'soma') {
        player.stop()
      }
    }
  }, [player, cleanupAudio])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume
    }
  }, [player.volume])

  const stopPlayback = useCallback(() => {
    cleanupAudio()
    player.stop()
    setPlayError(null)
    retryCountRef.current = 0
  }, [player, cleanupAudio])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (player.isPlaying) {
      audioRef.current.pause()
      player.setPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => player.setPlaying(true))
        .catch(() => {})
    }
  }, [player])

  const handlePlay = useCallback((channel: Channel) => {
    if (player.playingId === channel.id && player.isPlaying) {
      stopPlayback()
      return
    }

    const streamUrl = parseStreamUrl(channel.playlists?.[0]?.url)
    if (!streamUrl || !audioRef.current) return

    setPlayError(null)
    retryCountRef.current = 0
    cleanupAudio()

    player.play({
      id: channel.id,
      title: channel.title,
      subtitle: channel.lastPlaying,
      type: 'soma',
    })

    audioRef.current.src = streamUrl
    audioRef.current.volume = player.volume

    audioRef.current.play()
      .then(() => {
        player.setPlaying(true)
        player.setLoading(false)
      })
      .catch(() => {
        player.stop()
        setPlayError('Unable to play stream. Try again.')
      })
  }, [player, stopPlayback, cleanupAudio])

  return {
    player,
    playError,
    setPlayError,
    handlePlay,
    stopPlayback,
    togglePlayPause,
  }
}
