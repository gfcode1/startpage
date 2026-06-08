import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { MediaCard } from '../../framework/components/MediaCard'
import { AppHeader } from '../../framework/components/AppHeader'
import { PlayerBar } from '../../framework/components/PlayerBar'
import { GfBadge } from '../../framework/components/Badge'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { usePlayer } from '../../framework/PlayerContext'
import { fetchTopTags, fetchCountries, searchStations, clickStation, isHlsStream } from './api'
import type { RadioStation, Tag, Country } from './types'
import { countryCoords } from './countryCoords'
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
  const [showMap, setShowMap] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerTypeRef = useRef(player.type)
  const requestIdRef = useRef(0)
  const clickAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const abort = new AbortController()
    const id = ++requestIdRef.current
    const timer = setTimeout(async () => {
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
    }, search ? 300 : 0)

    return () => {
      clearTimeout(timer)
      abort.abort()
    }
  }, [selectedTag, selectedCountry, search])

  useEffect(() => {
    const abort = new AbortController()
    async function init() {
      try {
        const [fetchedTags, fetchedCountries] = await Promise.all([
          fetchTopTags(20, abort.signal),
          fetchCountries(30, abort.signal),
        ])
        if (abort.signal.aborted) return
        setTags(fetchedTags)
        setCountries(fetchedCountries)
      } catch (err) {
        if (abort.signal.aborted) return
        console.warn('RadioBrowser: failed to load filters', err)
      }
    }
    init()
    return () => abort.abort()
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadMap() {
      if (!showMap) return
      await import('leaflet/dist/leaflet.css')
      const L = await import('leaflet')
      if (!mounted) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.default.Icon.Default.prototype as any)._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      if (!mounted) return
      setMapReady(true)
    }
    loadMap()
    return () => { mounted = false }
  }, [showMap])

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

  const handleSelectCountry = useCallback((cc: string) => {
    setSelectedCountry(cc)
  }, [])

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

    if (clickAbortRef.current) clickAbortRef.current.abort()
    const ctrl = new AbortController()
    clickAbortRef.current = ctrl
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

    const handleAudioError = () => {
      if (playerTypeRef.current === 'radiobrowser' && player.playingId) {
        console.warn('RadioBrowser: stream error during playback')
        player.stop()
        setPlayError('Stream connection lost. The station may be offline.')
      }
    }
    audio.addEventListener('error', handleAudioError)

    return () => {
      audio.removeEventListener('error', handleAudioError)
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

      <div className="gf-radiobrowser__toolbar-row">
        <div className="gf-radiobrowser__country-row" role="radiogroup" aria-label="Filter by country">
          <button
            className={`gf-radiobrowser__country-chip ${selectedCountry === 'all' ? 'gf-radiobrowser__country-chip--active' : ''}`}
            onClick={() => setSelectedCountry('all')}
            role="radio"
            aria-checked={selectedCountry === 'all'}
          >
            All
          </button>
          {countries.filter(c => c.iso_3166_1).map(c => (
            <button
              key={c.iso_3166_1!}
              className={`gf-radiobrowser__country-chip ${selectedCountry === c.iso_3166_1 ? 'gf-radiobrowser__country-chip--active' : ''}`}
              onClick={() => setSelectedCountry(c.iso_3166_1!)}
              role="radio"
              aria-checked={selectedCountry === c.iso_3166_1}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          className={`gf-radiobrowser__map-toggle ${showMap ? 'gf-radiobrowser__map-toggle--active' : ''}`}
          onClick={() => setShowMap(prev => !prev)}
          aria-label={showMap ? 'Hide map' : 'Show map'}
          title={showMap ? 'Hide map' : 'Show map'}
        >
          <span className="gf-radiobrowser__map-toggle-icon">{showMap ? '\u25B2' : '\u25BC'}</span>
          Map
        </button>
      </div>

      <div className={`gf-radiobrowser__map-container ${showMap ? '' : 'gf-radiobrowser__map-container--hidden'}`}>
        {!mapReady ? (
          <div className="gf-radiobrowser__map-loading">Loading map...</div>
        ) : (
          <LeafletMap
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
          />
        )}
      </div>

      {playError && (
        <p className="gf-radiobrowser__error">{playError}</p>
      )}

      {loading ? (
        <div className="gf-radiobrowser__grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="gf-radiobrowser__skeleton" />
          ))}
        </div>
      ) : stations.length === 0 ? (
        <GfEmptyState
          icon={<GfIcon name="radio" size={24} />}
          title="No stations found"
          description="Try a different search term, tag, or country"
        />
      ) : (
        <div className="gf-radiobrowser__grid">
          {stations.map((station, i) => (
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
          ))}
        </div>
      )}

      {player.type === 'radiobrowser' && (
        <PlayerBar
          isPlaying={player.isPlaying}
          isLoading={player.isLoading}
          title={player.playingTitle}
          subtitle={player.subtitle}
          volume={player.volume}
          queue={player.queue}
          sleepTimer={player.sleepTimer}
          onVolumeChange={player.setVolume}
          onStop={stopPlayback}
          onRemoveFromQueue={player.removeFromQueue}
          onSetSleepTimer={player.setSleepTimer}
        />
      )}
    </div>
  )
}

function LeafletMap({
  countries,
  selectedCountry,
  onSelectCountry,
}: {
  countries: Country[]
  selectedCountry: string
  onSelectCountry: (code: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<{ remove: () => void } | null>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    let cancelled = false

    async function setup() {
      const L = await import('leaflet')
      if (cancelled || !mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map)

      const filtered = countries.filter(c => c.iso_3166_1 && countryCoords[c.iso_3166_1])
      const bounds: [number, number][] = []

      for (const c of filtered) {
        const coords = countryCoords[c.iso_3166_1!]
        if (!coords) continue
        bounds.push(coords)

        const size = Math.min(20, Math.max(4, Math.log2(Number(c.stationcount) + 1) * 4))
        const marker = L.circleMarker(coords, {
          radius: size,
          fillColor: c.iso_3166_1 === selectedCountry ? '#f97316' : '#3b82f6',
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6,
        })

        const popupEl = document.createElement('div')
        popupEl.innerHTML = `<strong>${c.name}</strong><br/>${c.stationcount} stations<br/>`
        const btn = document.createElement('button')
        btn.className = 'gf-map-browse-btn'
        btn.textContent = 'Browse stations'
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelectCountry(c.iso_3166_1!)
        })
        popupEl.appendChild(btn)
        marker.bindPopup(popupEl)

        marker.on('click', () => {
          onSelectCountry(c.iso_3166_1!)
        })

        marker.addTo(map)
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] })
      }

      if (!cancelled) {
        instanceRef.current = map
      } else {
        map.remove()
      }
    }

    setup()

    return () => {
      cancelled = true
      if (instanceRef.current) {
        try {
          instanceRef.current.remove()
        } catch {
          /* ignore cleanup errors */
        }
        instanceRef.current = null
      }
    }
  }, [countries, selectedCountry, onSelectCountry])

  useEffect(() => {
    const map = instanceRef.current
    if (!map) return
    const { eachLayer } = map as unknown as { eachLayer: (fn: (l: { getLatLng?: () => { lat: number; lng: number }; setStyle?: (s: Record<string, string>) => void; feature?: unknown }) => void) => void }
    eachLayer((layer) => {
      if (layer.feature || !layer.getLatLng || !layer.setStyle) return
      const ll = layer.getLatLng!()
      const country = countries.find(c => {
        const coords = countryCoords[c.iso_3166_1!]
        if (!coords) return false
        return Math.abs(ll.lat - coords[0]) < 1 && Math.abs(ll.lng - coords[1]) < 1
      })
      if (country) {
        layer.setStyle!({
          fillColor: country.iso_3166_1 === selectedCountry ? '#f97316' : '#3b82f6',
        })
      }
    })
  }, [selectedCountry, countries])

  return (
    <div
      ref={mapRef}
      className="gf-radiobrowser__map"
    />
  )
}
