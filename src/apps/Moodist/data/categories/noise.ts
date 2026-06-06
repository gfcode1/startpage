import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/noise'

export const noise: Category = {
  id: 'noise',
  title: 'Noise',
  icon: '\u{1F50A}',
  sounds: [
    { id: 'white-noise', label: 'White Noise', src: `${BASE}/white-noise.mp3` },
    { id: 'pink-noise', label: 'Pink Noise', src: `${BASE}/pink-noise.mp3` },
    { id: 'brown-noise', label: 'Brown Noise', src: `${BASE}/brown-noise.mp3` },
  ],
}
