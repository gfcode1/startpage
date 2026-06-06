import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { GfBadge } from '../../framework/components/Badge'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import { fetchTopTags, fetchCountries, searchStations, clickStation, isHlsStream } from './api'
import type { RadioStation, Tag, Country } from './types'
import './RadioBrowserApp.css'

const APP_ID = 'radiobrowser'

interface FilterTag {
  value: string
  label: string
}

export default function RadioBrowserApp() {
  const player = usePlayer()
  const [stations, setStations] = useState<RadioStation[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useAppStorage<string[]>(APP_ID, 'favorites', [])
  const [loading, setLoading] = useState(true)
  const [playError, setPlayError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerTypeRef = useRef(player.type)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const abort = new AbortController()
    const id = ++requestIdRef.current

    async function load() {
      setLoading(true)
      setPlayError(null)
      try {
        const opts: { name?: string; tag?: string; countrycode?: string } = {}
        if (search) {
          opts.name = search
        } else if (selectedTag !== 'all') {
          opts.tag = selectedTag
        }
        if (selectedCountry !== 'all') {
          opts.countrycode = selectedCountry
        }
        let result = await searchStations(opts, abort.signal)
        if (abort.signal.aborted || id !== requestIdRef.current) return
        result = result.filter(s => !isHlsStream(s))
        setStations(result)
      } catch (err) {
        if (abort.signal.aborted || id !== requestIdRef.current) return
        console.warn('RadioBrowser: load stations failed', err)
        setPlayError('Failed to load stations. Try again.')
      } finally {
        if (abort.signal.aborted || id !== requestIdRef.current) return
        setLoading(false)
      }
    }

    load()
    return () => abort.abort()
  }, [selectedTag, selectedCountry, search])

  useEffect(() => {
    const abort = new AbortController()
    async function init() {
      const [fetchedTags, fetchedCountries] = await Promise.all([
        fetchTopTags(20, abort.signal),
        fetchCountries(30, abort.signal),
      ])
      if (abort.signal.aborted) return
      setTags(fetchedTags)
      setCountries(fetchedCountries)
    }
    init()
    return () => abort.abort()
  }, [])

  const tagSegments: FilterTag[] = useMemo(() => {
    return [
      { value: 'all', label: 'All' },
      ...tags.map(t => ({ value: t.name, label: t.name.charAt(0).toUpperCase() + t.name.slice(1) })),
    ]
  }, [tags])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }, [setFavorites])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    player.stop()
    setPlayError(null)
  }, [player])

  const handlePlay = useCallback(async (station: RadioStation) => {
    if (player.playingId === station.stationuuid && player.isPlaying) {
      stopPlayback()
      return
    }

    setPlayError(null)

    if (isHlsStream(station)) {
      setPlayError(`"${station.name}" uses HLS format which is not supported in this browser.`)
      return
    }

    const ctrl = new AbortController()
    const clickResult = await clickStation(station.stationuuid, ctrl.signal)
    const streamUrl = clickResult?.url || station.url_resolved || station.url
    if (!streamUrl || !audioRef.current) return

    player.play({
      id: station.stationuuid,
      title: station.name,
      subtitle: station.codec ? `${station.codec}${station.bitrate ? ` ${station.bitrate}kbps` : ''}` : '',
      type: 'radiobrowser',
    })

    audioRef.current.src = streamUrl
    audioRef.current.volume = player.volume

    try {
      await audioRef.current.play()
      player.setPlaying(true)
      player.setLoading(false)
    } catch (err) {
      console.warn('RadioBrowser: play stream failed', err)
      player.stop()
      setPlayError(`Unable to play "${station.name}". The stream may be offline.`)
    }
  }, [player, stopPlayback])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
      if (playerTypeRef.current === 'radiobrowser') {
        player.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only, stop on unmount
  }, [])

  useEffect(() => {
    playerTypeRef.current = player.type
  }, [player.type])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume
    }
  }, [player.volume])

  function formatDescription(station: RadioStation): string {
    const parts: string[] = []
    if (station.codec) parts.push(station.codec)
    if (station.bitrate) parts.push(`${station.bitrate}kbps`)
    const location = station.country || station.countrycode || ''
    if (location) parts.push(location)
    return parts.join(' \u00b7 ')
  }

  return (
    <div className="gf-radiobrowser">
      <AppHeader
        title="Radio Browser"
        badge={`${stations.length} stations`}
        segments={tagSegments}
        segmentValue={selectedTag}
        onSegmentChange={setSelectedTag}
        searchPlaceholder="Search stations..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="gf-radiobrowser__country-row">
        <button
          className={`gf-radiobrowser__country-chip ${selectedCountry === 'all' ? 'gf-radiobrowser__country-chip--active' : ''}`}
          onClick={() => setSelectedCountry('all')}
          aria-pressed={selectedCountry === 'all'}
        >
          All
        </button>
        {countries.filter(c => c.iso_3166_1).map(c => (
          <button
            key={c.iso_3166_1!}
            className={`gf-radiobrowser__country-chip ${selectedCountry === c.iso_3166_1 ? 'gf-radiobrowser__country-chip--active' : ''}`}
            onClick={() => setSelectedCountry(c.iso_3166_1!)}
            aria-pressed={selectedCountry === c.iso_3166_1}
          >
            {c.name}
          </button>
        ))}
      </div>

      {playError && (
        <p className="gf-radiobrowser__error">{playError}</p>
      )}

      <div className="gf-radiobrowser__grid">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="gf-radiobrowser__skeleton" />
          ))
        ) : stations.length === 0 ? (
          <p className="gf-radiobrowser__empty">No stations found</p>
        ) : (
          stations.map((station, i) => (
            <MediaCard
              key={station.stationuuid}
              id={station.stationuuid}
              index={i}
              image={station.favicon || undefined}
              title={station.name}
              description={formatDescription(station)}
              metadata={
                <>
                  {station.tags && (
                    <GfBadge variant="listeners">
                      {station.tags.split(',').slice(0, 3).join(', ')}
                    </GfBadge>
                  )}
                  <GfBadge variant={station.lastcheckok ? 'listeners' : 'default'}>
                    {station.lastcheckok ? '\u25cf Live' : '\u25cb Offline'}
                  </GfBadge>
                </>
              }
              isPlaying={player.playingId === station.stationuuid}
              isLoading={player.isLoading && player.playingId === station.stationuuid}
              isFavorite={favorites.includes(station.stationuuid)}
              onPlay={() => handlePlay(station)}
              onFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      {player.type === 'radiobrowser' && (
        <PlayerBar
          isPlaying={player.isPlaying}
          isLoading={player.isLoading}
          title={player.playingTitle}
          subtitle={player.subtitle}
          volume={player.volume}
          onVolumeChange={player.setVolume}
          onStop={stopPlayback}
        />
      )}
    </div>
  )
}
