import { Text, Group, Loader, Center } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useWeatherLocation } from '@/stores/weather-location-store'
import { WEATHER_EMOJIS } from '../shared'

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function WeatherWidget() {
  const { lat, lon } = useWeatherLocation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather-widget', lat, lon],
    queryFn: () => fetchWeather(lat, lon),
    staleTime: 1000 * 60 * 30,
    enabled: lat !== 0 && lon !== 0,
  })

  if (isLoading) return <Center py="md"><Loader size="sm" /></Center>
  if (isError) return <Center py="md"><Text size="sm" c="dimmed">Weather unavailable</Text></Center>
  if (!data?.current) return null

  const weatherCode = data.current.weather_code
  const emoji = WEATHER_EMOJIS[weatherCode] ?? '🌤️'

  return (
    <Group justify="center" gap="xs">
      <Text style={{ fontSize: '2rem' }}>{emoji}</Text>
      <div>
        <Text fw={700} style={{ fontSize: '1.3rem' }}>
          {Math.round(data.current.temperature_2m)}°C
        </Text>
        {data.daily && (
          <Text size="xs" c="dimmed">
            H:{Math.round(data.daily.temperature_2m_max[0])}° L:{Math.round(data.daily.temperature_2m_min[0])}°
          </Text>
        )}
      </div>
    </Group>
  )
}
