import { Text, Group } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { useWeatherLocation } from '@/stores/weather-location-store'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'
import { WidgetLoading, WidgetEmpty } from '@/ui/widget-container'
import { WEATHER_EMOJIS } from '../shared'

interface WidgetWeatherData {
  current: {
    temperature_2m: number
    weather_code: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

async function fetchWeather(lat: number, lon: number, unit: string): Promise<WidgetWeatherData> {
  const tempUnit = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code` +
    `&hourly=temperature_2m,weather_code&forecast_hours=8` +
    `&daily=temperature_2m_max,temperature_2m_min&forecast_days=1` +
    `&temperature_unit=${tempUnit}`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function WeatherWidget() {
  const { lat, lon, name } = useWeatherLocation()
  const unit = useWidgetOptionsStore((s) => (s.options.weather?.unit as string) ?? 'celsius')
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather-widget', lat, lon, unit],
    queryFn: () => fetchWeather(lat, lon, unit),
    staleTime: 1000 * 60 * 30,
    enabled: lat !== 0 && lon !== 0,
  })

  if (isLoading) return <WidgetLoading />
  if (isError) return <WidgetEmpty>Weather unavailable</WidgetEmpty>
  if (!data?.current) return null

  const weatherCode = data.current.weather_code
  const emoji = WEATHER_EMOJIS[weatherCode] ?? '🌤️'
  const tempUnit = unit === 'fahrenheit' ? '\u00B0F' : '\u00B0C'

  const hourlyData = data.hourly?.time.map((t, i) => ({
    hour: new Date(t).getHours(),
    temp: Math.round(data.hourly.temperature_2m[i]!),
  })) ?? []

  return (
    <div
      style={{ cursor: 'pointer' }}
      onClick={() => navigate('/weather')}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/weather') }}
    >
      <Text size="xs" c="dimmed" ta="center" truncate="end">
        {name}
      </Text>
      <Group justify="center" gap="xs" mt={2}>
        <Text style={{ fontSize: '1.6rem' }}>{emoji}</Text>
        <div>
          <Text fw={700} size="xl">
            {Math.round(data.current.temperature_2m)}{tempUnit}
          </Text>
          {data.daily && (
            <Text size="xs" c="dimmed">
              H:{Math.round(data.daily.temperature_2m_max[0]!)}{tempUnit} L:{Math.round(data.daily.temperature_2m_min[0]!)}{tempUnit}
            </Text>
          )}
        </div>
      </Group>

      {hourlyData.length > 0 && (
        <ResponsiveContainer width="100%" height={40}>
          <BarChart data={hourlyData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="temp" fill="var(--mantine-color-blue-3)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
