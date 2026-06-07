import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/urban'

export const urban: Category = {
  id: 'urban',
  title: 'Urban',
  icon: 'gamepad',
  sounds: [
    { id: 'highway', label: 'Highway', src: `${BASE}/highway.mp3` },
    { id: 'road', label: 'Road', src: `${BASE}/road.mp3` },
    { id: 'ambulance-siren', label: 'Ambulance Siren', src: `${BASE}/ambulance-siren.mp3` },
    { id: 'busy-street', label: 'Busy Street', src: `${BASE}/busy-street.mp3` },
    { id: 'crowd', label: 'Crowd', src: `${BASE}/crowd.mp3` },
    { id: 'traffic', label: 'Traffic', src: `${BASE}/traffic.mp3` },
    { id: 'fireworks', label: 'Fireworks', src: `${BASE}/fireworks.mp3` },
  ],
}
