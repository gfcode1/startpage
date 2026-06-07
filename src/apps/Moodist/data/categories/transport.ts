import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/transport'

export const transport: Category = {
  id: 'transport',
  title: 'Transport',
  icon: 'radio',
  sounds: [
    { id: 'train', label: 'Train', src: `${BASE}/train.mp3` },
    { id: 'inside-a-train', label: 'Inside a Train', src: `${BASE}/inside-a-train.mp3` },
    { id: 'airplane', label: 'Airplane', src: `${BASE}/airplane.mp3` },
    { id: 'submarine', label: 'Submarine', src: `${BASE}/submarine.mp3` },
    { id: 'sailboat', label: 'Sailboat', src: `${BASE}/sailboat.mp3` },
    { id: 'rowing-boat', label: 'Rowing Boat', src: `${BASE}/rowing-boat.mp3` },
  ],
}
