import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/rain'

export const rain: Category = {
  id: 'rain',
  title: 'Rain',
  icon: 'weather-drizzle',
  sounds: [
    { id: 'light-rain', label: 'Light Rain', src: `${BASE}/light-rain.mp3` },
    { id: 'heavy-rain', label: 'Heavy Rain', src: `${BASE}/heavy-rain.mp3` },
    { id: 'thunder', label: 'Thunder', src: `${BASE}/thunder.mp3` },
    { id: 'rain-on-window', label: 'Rain on Window', src: `${BASE}/rain-on-window.mp3` },
    { id: 'rain-on-car-roof', label: 'Rain on Car Roof', src: `${BASE}/rain-on-car-roof.mp3` },
    { id: 'rain-on-umbrella', label: 'Rain on Umbrella', src: `${BASE}/rain-on-umbrella.mp3` },
    { id: 'rain-on-tent', label: 'Rain on Tent', src: `${BASE}/rain-on-tent.mp3` },
    { id: 'rain-on-leaves', label: 'Rain on Leaves', src: `${BASE}/rain-on-leaves.mp3` },
  ],
}
