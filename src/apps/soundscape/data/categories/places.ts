import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/places'

export const places: Category = {
  id: 'places',
  title: 'Places',
  icon: 'lucide:map-pin',
  sounds: [
    { id: 'cafe', label: 'Cafe', src: `${BASE}/cafe.mp3` },
    { id: 'airport', label: 'Airport', src: `${BASE}/airport.mp3` },
    { id: 'church', label: 'Church', src: `${BASE}/church.mp3` },
    { id: 'temple', label: 'Temple', src: `${BASE}/temple.mp3` },
    { id: 'construction-site', label: 'Construction Site', src: `${BASE}/construction-site.mp3` },
    { id: 'underwater', label: 'Underwater', src: `${BASE}/underwater.mp3` },
    { id: 'crowded-bar', label: 'Crowded Bar', src: `${BASE}/crowded-bar.mp3` },
    { id: 'night-village', label: 'Night Village', src: `${BASE}/night-village.mp3` },
    { id: 'subway-station', label: 'Subway Station', src: `${BASE}/subway-station.mp3` },
    { id: 'office', label: 'Office', src: `${BASE}/office.mp3` },
    { id: 'supermarket', label: 'Supermarket', src: `${BASE}/supermarket.mp3` },
    { id: 'carousel', label: 'Carousel', src: `${BASE}/carousel.mp3` },
    { id: 'laboratory', label: 'Laboratory', src: `${BASE}/laboratory.mp3` },
    { id: 'laundry-room', label: 'Laundry Room', src: `${BASE}/laundry-room.mp3` },
    { id: 'restaurant', label: 'Restaurant', src: `${BASE}/restaurant.mp3` },
    { id: 'library', label: 'Library', src: `${BASE}/library.mp3` },
  ],
}
