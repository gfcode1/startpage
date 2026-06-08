export interface CityResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
  admin1?: string
}

export interface CurrentWeather {
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  weather_code: number
  wind_speed_10m: number
  pressure_msl: number
}

export interface DailyWeather {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
  wind_speed_10m_max: number[]
  sunrise: string[]
  sunset: string[]
}

export interface HistoricalDaily {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
}

export interface HistoricalWeather {
  daily: HistoricalDaily
}

export interface WeatherData {
  current: CurrentWeather
  daily: DailyWeather
  historical?: HistoricalWeather
  timezone: string
}

export interface WeatherState {
  city: string
  country: string
  coords: { lat: number; lon: number }
  data: WeatherData | null
  loading: boolean
  error: string | null
}
