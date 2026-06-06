export interface WeatherCodeInfo {
  label: string
  icon: string
  gradient: string
  gradientNight: string
}

const weatherCodes: Record<number, WeatherCodeInfo> = {
  0: {
    label: 'Clear',
    icon: '☀️',
    gradient: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    gradientNight: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  },
  1: {
    label: 'Mostly clear',
    icon: '🌤️',
    gradient: 'linear-gradient(135deg, #f8b195, #f67280)',
    gradientNight: 'linear-gradient(135deg, #141e30, #243b55)',
  },
  2: {
    label: 'Partly cloudy',
    icon: '⛅',
    gradient: 'linear-gradient(135deg, #bdc3c7, #2c3e50)',
    gradientNight: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  },
  3: {
    label: 'Overcast',
    icon: '☁️',
    gradient: 'linear-gradient(135deg, #8e9eab, #eef2f3)',
    gradientNight: 'linear-gradient(135deg, #2c3e50, #1a1a2e)',
  },
  45: {
    label: 'Fog',
    icon: '🌫️',
    gradient: 'linear-gradient(135deg, #bdc3c7, #8e9eab)',
    gradientNight: 'linear-gradient(135deg, #2c3e50, #4a5568)',
  },
  48: {
    label: 'Freezing fog',
    icon: '🌫️',
    gradient: 'linear-gradient(135deg, #d5dde0, #8e9eab)',
    gradientNight: 'linear-gradient(135deg, #1a202c, #2d3748)',
  },
  51: {
    label: 'Light drizzle',
    icon: '🌦️',
    gradient: 'linear-gradient(135deg, #4b6cb7, #182848)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  53: {
    label: 'Drizzle',
    icon: '🌦️',
    gradient: 'linear-gradient(135deg, #4b6cb7, #182848)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  55: {
    label: 'Heavy drizzle',
    icon: '🌦️',
    gradient: 'linear-gradient(135deg, #3a6186, #89253e)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  61: {
    label: 'Light rain',
    icon: '🌧️',
    gradient: 'linear-gradient(135deg, #3a7bd5, #3a6073)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  63: {
    label: 'Rain',
    icon: '🌧️',
    gradient: 'linear-gradient(135deg, #3a6186, #89253e)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  65: {
    label: 'Heavy rain',
    icon: '🌧️',
    gradient: 'linear-gradient(135deg, #2c3e50, #3498db)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  71: {
    label: 'Light snow',
    icon: '❄️',
    gradient: 'linear-gradient(135deg, #e6e9f0, #eef1f5)',
    gradientNight: 'linear-gradient(135deg, #1a202c, #2d3748, #4a5568)',
  },
  73: {
    label: 'Snow',
    icon: '❄️',
    gradient: 'linear-gradient(135deg, #d5dde0, #b8c6db)',
    gradientNight: 'linear-gradient(135deg, #1a202c, #2d3748, #4a5568)',
  },
  75: {
    label: 'Heavy snow',
    icon: '❄️',
    gradient: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
    gradientNight: 'linear-gradient(135deg, #1a202c, #2d3748, #4a5568)',
  },
  80: {
    label: 'Light showers',
    icon: '🌦️',
    gradient: 'linear-gradient(135deg, #4b6cb7, #182848)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  81: {
    label: 'Showers',
    icon: '🌦️',
    gradient: 'linear-gradient(135deg, #3a6186, #89253e)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  82: {
    label: 'Heavy showers',
    icon: '🌧️',
    gradient: 'linear-gradient(135deg, #2c3e50, #3498db)',
    gradientNight: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  95: {
    label: 'Thunderstorm',
    icon: '⛈️',
    gradient: 'linear-gradient(135deg, #141e30, #243b55)',
    gradientNight: 'linear-gradient(135deg, #0f0c29, #1a1a2e)',
  },
  96: {
    label: 'Thunderstorm hail',
    icon: '⛈️',
    gradient: 'linear-gradient(135deg, #141e30, #243b55)',
    gradientNight: 'linear-gradient(135deg, #0f0c29, #1a1a2e)',
  },
  99: {
    label: 'Severe thunderstorm',
    icon: '⛈️',
    gradient: 'linear-gradient(135deg, #0f0c29, #302b63)',
    gradientNight: 'linear-gradient(135deg, #0f0c29, #302b63)',
  },
}

export function getWeatherInfo(code: number, isNight: boolean): WeatherCodeInfo {
  const info = weatherCodes[code] ?? weatherCodes[0]
  return {
    ...info,
    gradient: isNight ? info.gradientNight : info.gradient,
  }
}

export function isNightTime(sunrise?: string, sunset?: string): boolean {
  if (!sunrise || !sunset) return false
  const now = new Date()
  const rise = new Date(sunrise)
  const set = new Date(sunset)
  return now < rise || now > set
}
