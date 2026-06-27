import { memo, useState, useRef, useEffect } from 'react'
import { Container, Text, Group, Paper, SimpleGrid, Loader, Center, TextInput, SegmentedControl, Alert, ActionIcon, Chip, ScrollArea } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
    pressure_msl: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    apparent_temperature: number[]
    weather_code: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
    precipitation_probability_max: number[]
  }
}

import { WEATHER_EMOJIS, getWeatherDescription } from './shared'

async function fetchWeather(lat: number, lon: number, signal: AbortSignal): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl` +
    `&hourly=temperature_2m,apparent_temperature,weather_code&forecast_hours=24` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max,precipitation_probability_max` +
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

const WeatherIcon = memo(function WeatherIcon({ code, size }: { code: number; size?: string }) {
  return <span style={{ fontSize: size ?? '2rem' }} role="img" aria-label={`Weather code ${code}`}>{WEATHER_EMOJIS[code] ?? '🌤️'}</span>
})

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lon], 10) }, [map, lat, lon])
  return null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en', { hour: 'numeric', hour12: true })
}

function formatHour(iso: string): string {
  const h = new Date(iso).getHours()
  return `${h}:00`
}

function SunTime({ label, iso }: { label: string; iso: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm">{formatTime(iso)}</Text>
    </div>
  )
}

export default function WeatherApp() {
  const { lat, lon, name: locationName, setLocation, recentCities, detectLocation, geoLoading, geoError, clearGeoError } = useWeatherLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'current' | 'today' | 'week'>('current')
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
  const hourly = weather?.hourly

  const hourlyData = hourly?.time.map((t, i) => ({
    time: formatHour(t),
    temp: Math.round(hourly.temperature_2m[i]!),
    feels: Math.round(hourly.apparent_temperature[i]!),
    code: hourly.weather_code[i]!,
  })) ?? []

  const todayRain = daily ? daily.precipitation_probability_max[0] : 0
  const todayUv = daily ? daily.uv_index_max[0] : 0

  return (
    <Container size="lg" py="md">
      <Text fw={700} size="lg" mb="md" style={{ fontFamily: 'var(--mantine-heading-font-family)' }}>
        Weather — {locationName}
      </Text>

      <Group gap="xs" mb="sm" wrap="nowrap">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery) }}
          style={{ flex: 1 }}
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
        <ActionIcon
          variant="light"
          size="lg"
          loading={geoLoading}
          onClick={detectLocation}
          aria-label="Detect location"
        >
          <Icon icon="lucide:locate" width={18} />
        </ActionIcon>
      </Group>

      {geoError && (
        <Alert color="yellow" mb="sm" withCloseButton onClose={clearGeoError}>
          {geoError}
        </Alert>
      )}

      {recentCities.length > 0 && (
        <Chip.Group multiple={false}>
          <Group gap="xs" mb="md">
            {recentCities.map((city) => (
              <Chip
                key={city.name}
                value={city.name}
                checked={city.name === locationName}
                size="xs"
                onClick={() => setLocation(city.lat, city.lon, city.name)}
              >
                {city.name}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      )}

      {weatherQuery.isLoading && (
        <Center py="xl"><Loader /></Center>
      )}

      {weatherQuery.isError && (
        <Alert color="red" title="Error" mb="md">Failed to load weather data.</Alert>
      )}

      <SegmentedControl
        value={view}
        onChange={(v) => { if (v === 'current' || v === 'today' || v === 'week') setView(v) }}
        data={[
          { label: 'Current', value: 'current' },
          { label: 'Today', value: 'today' },
          { label: '7 Days', value: 'week' },
        ]}
        size="xs"
        mb="md"
      />

      {view === 'current' && current && (
        <Paper withBorder p="lg" radius="md" mb="md">
          <Group justify="center" mb="xs">
            <WeatherIcon code={current.weather_code} size="3rem" />
          </Group>
          <Text ta="center" size="display" fw={700} style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
            {Math.round(current.temperature_2m)}°C
          </Text>
          <Text ta="center" c="dimmed" size="md">
            {getWeatherDescription(current.weather_code)}
          </Text>
          <Text ta="center" c="dimmed" size="sm">Feels like {Math.round(current.apparent_temperature)}°C</Text>

          <SimpleGrid cols={{ base: 3, sm: 5 }} mt="lg">
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
              <Icon icon="lucide:gauge" width={20} />
              <Text size="sm">{Math.round(current.pressure_msl)} hPa</Text>
              <Text size="xs" c="dimmed">Pressure</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Icon icon="lucide:umbrella" width={20} />
              <Text size="sm">{todayRain}%</Text>
              <Text size="xs" c="dimmed">Rain</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Icon icon="lucide:sun" width={20} />
              <Text size="sm">{todayUv}</Text>
              <Text size="xs" c="dimmed">UV Index</Text>
            </div>
          </SimpleGrid>

          {daily && (
            <Group justify="center" mt="md" gap="xl">
              <SunTime label="Sunrise" iso={daily.sunrise[0]!} />
              <SunTime label="Sunset" iso={daily.sunset[0]!} />
            </Group>
          )}
        </Paper>
      )}

      {view === 'today' && hourly && (
        <>
          <Paper withBorder p="md" radius="md" mb="md">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--mantine-color-blue-5)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--mantine-color-blue-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-dark-4)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }} axisLine={false} tickLine={false} width={36} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--mantine-color-dark-7)',
                    border: '1px solid var(--mantine-color-dark-4)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${Number(value)}°C`, 'Temperature']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area type="monotone" dataKey="temp" stroke="var(--mantine-color-blue-5)" fill="url(#tempGradient)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          <ScrollArea offsetScrollbars>
            <Group gap="sm" pb="xs" wrap="nowrap">
              {hourlyData.map((h, i) => (
                <Paper key={i} withBorder p="sm" radius="md" style={{ minWidth: 72, textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">{h.time}</Text>
                  <WeatherIcon code={h.code} size="1.2rem" />
                  <Text fw={600} size="sm">{h.temp}°</Text>
                </Paper>
              ))}
            </Group>
          </ScrollArea>
        </>
      )}

      {view === 'week' && daily && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {daily.time.map((date, i) => (
            <Paper key={date} withBorder p="sm" radius="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">
                {new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <WeatherIcon code={daily.weather_code[i]!} size="1.5rem" />
              <Text fw={600}>{Math.round(daily.temperature_2m_max[i]!)}°</Text>
              <Text size="xs" c="dimmed">{Math.round(daily.temperature_2m_min[i]!)}°</Text>
              <Text size="xs" c="var(--mantine-color-blue-5)">
                {Math.round(daily.precipitation_probability_max[i]!)}%
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Paper withBorder p="sm" radius="md" mt="md" style={{ height: 300 }}>
        <MapContainer
          center={[lat, lon]}
          zoom={10}
          style={{ height: '100%', borderRadius: 'var(--mantine-radius-md)' }}
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
