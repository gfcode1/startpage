import { memo, useState, useRef, useEffect } from 'react'
import { Container, Text, Group, Paper, SimpleGrid, Loader, Center, TextInput, SegmentedControl, Alert } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWeatherLocation } from '@/stores/weather-location-store'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface WeatherData {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
}

import { WEATHER_EMOJIS } from './shared'

async function fetchWeather(lat: number, lon: number, signal: AbortSignal): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=7`,
    { signal },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function searchLocation(query: string, signal: AbortSignal) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
    { signal },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const WeatherIcon = memo(function WeatherIcon({ code }: { code: number }) {
  return <span style={{ fontSize: '2rem' }} role="img" aria-label={`Weather code ${code}`}>{WEATHER_EMOJIS[code] ?? '🌤️'}</span>
})

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lon], 10) }, [map, lat, lon])
  return null
}

export default function WeatherApp() {
  const { lat, lon, name: locationName, setLocation } = useWeatherLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'current' | 'week'>('current')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchAbortRef = useRef<AbortController | null>(null)

  const weatherQuery = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: ({ signal }) => fetchWeather(lat, lon, signal!),
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 30,
  })

  async function handleSearch(query: string) {
    if (!query.trim()) return
    searchAbortRef.current?.abort()
    const abort = new AbortController()
    searchAbortRef.current = abort
    setSearchError(null)
    setSearchLoading(true)

    try {
      const data = await searchLocation(query, abort.signal)
      if (data.results?.[0]) {
        setLocation(data.results[0].latitude, data.results[0].longitude, data.results[0].name)
        setSearchQuery('')
        setSearchError(null)
      } else {
        setSearchError('City not found')
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setSearchError('Search failed')
    }
    setSearchLoading(false)
  }

  useEffect(() => {
    return () => { searchAbortRef.current?.abort() }
  }, [])

  const weather = weatherQuery.data
  const current = weather?.current
  const daily = weather?.daily

  return (
    <Container size="lg" py="md">
      <Text fw={700} size="lg" mb="md" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Weather — {locationName}
      </Text>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery) }}
        style={{ marginBottom: 16 }}
      >
        <TextInput
          placeholder="Search city..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.currentTarget.value)
            if (searchError) setSearchError(null)
          }}
          leftSection={searchLoading ? undefined : <Icon icon="lucide:search" width={16} />}
          rightSection={searchLoading ? <Loader size="xs" /> : undefined}
          error={searchError}
        />
      </form>

      {weatherQuery.isLoading && (
        <Center py="xl"><Loader /></Center>
      )}

      {weatherQuery.isError && (
        <Alert color="red" title="Error" mb="md">Failed to load weather data.</Alert>
      )}

      <SegmentedControl
        value={view}
        onChange={(v) => { if (v === 'current' || v === 'week') setView(v) }}
        data={[
          { label: 'Current', value: 'current' },
          { label: '7 Days', value: 'week' },
        ]}
        size="xs"
        mb="md"
      />

      {view === 'current' && current && (
        <Paper withBorder p="lg" radius="md" mb="md">
          <Group justify="center" mb="md">
            <WeatherIcon code={current.weather_code} />
          </Group>
          <Text ta="center" size="display" fw={700} style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
            {Math.round(current.temperature_2m)}°C
          </Text>
          <Text ta="center" c="dimmed" size="sm">Feels like {Math.round(current.apparent_temperature)}°C</Text>

          <SimpleGrid cols={{ base: 2, sm: 3 }} mt="lg">
            <div style={{ textAlign: 'center' }}>
              <Icon icon="lucide:droplets" width={20} />
              <Text size="sm">{current.relative_humidity_2m}%</Text>
              <Text size="xs" c="dimmed">Humidity</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Icon icon="lucide:wind" width={20} />
              <Text size="sm">{Math.round(current.wind_speed_10m)} km/h</Text>
              <Text size="xs" c="dimmed">Wind</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <WeatherIcon code={current.weather_code} />
              <Text size="xs" c="dimmed">Conditions</Text>
            </div>
          </SimpleGrid>
        </Paper>
      )}

      {view === 'week' && daily && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {daily.time.map((date, i) => (
            <Paper key={date} withBorder p="sm" radius="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">
                {new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <WeatherIcon code={daily.weather_code[i]!} />
              <Text fw={600}>{Math.round(daily.temperature_2m_max[i]!)}°</Text>
              <Text size="xs" c="dimmed">{Math.round(daily.temperature_2m_min[i]!)}°</Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Paper withBorder p="sm" radius="md" mt="md" style={{ height: 300 }}>
        <MapContainer
          center={[lat, lon]}
          zoom={10}
          style={{ height: '100%', borderRadius: 6 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[lat, lon]}>
            <Popup>{locationName}</Popup>
          </Marker>
          <MapUpdater lat={lat} lon={lon} />
        </MapContainer>
      </Paper>
    </Container>
  )
}
