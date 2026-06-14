import { useState, useEffect } from 'react'
import { Text, Group, Stack } from '@mantine/core'
import { getStorage } from '@/lib/storage/engine'

interface CityConfig {
  name: string
  timezone: string
}

const DEFAULT_CITIES: CityConfig[] = [
  { name: 'New York', timezone: 'America/New_York' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
]

const STORAGE_KEY = 'widgets:worldclock'

function loadCities(): CityConfig[] {
  return getStorage().get<CityConfig[]>(STORAGE_KEY) ?? DEFAULT_CITIES
}

export default function WorldClockWidget() {
  const [cities] = useState<CityConfig[]>(loadCities)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Stack gap="xs">
      {cities.map((city) => {
        const time = now.toLocaleTimeString('en-US', {
          timeZone: city.timezone,
          hour: '2-digit',
          minute: '2-digit',
        })
        const date = now.toLocaleDateString('en-US', {
          timeZone: city.timezone,
          month: 'short',
          day: 'numeric',
        })

        return (
          <Group key={city.name} justify="space-between" wrap="nowrap">
            <div>
              <Text size="sm" fw={500}>{city.name}</Text>
              <Text size="xs" c="dimmed">{date}</Text>
            </div>
            <Text fw={700} style={{ fontFamily: 'monospace' }}>{time}</Text>
          </Group>
        )
      })}
    </Stack>
  )
}
