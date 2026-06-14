import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/nature'

export const nature: Category = {
  id: 'nature',
  title: 'Nature',
  icon: 'lucide:sparkles',
  sounds: [
    { id: 'river', label: 'River', src: `${BASE}/river.mp3` },
    { id: 'waves', label: 'Waves', src: `${BASE}/waves.mp3` },
    { id: 'campfire', label: 'Campfire', src: `${BASE}/campfire.mp3` },
    { id: 'wind', label: 'Wind', src: `${BASE}/wind.mp3` },
    { id: 'howling-wind', label: 'Howling Wind', src: `${BASE}/howling-wind.mp3` },
    { id: 'wind-in-trees', label: 'Wind in Trees', src: `${BASE}/wind-in-trees.mp3` },
    { id: 'waterfall', label: 'Waterfall', src: `${BASE}/waterfall.mp3` },
    { id: 'walk-in-snow', label: 'Walk in Snow', src: `${BASE}/walk-in-snow.mp3` },
    { id: 'walk-on-leaves', label: 'Walk on Leaves', src: `${BASE}/walk-on-leaves.mp3` },
    { id: 'walk-on-gravel', label: 'Walk on Gravel', src: `${BASE}/walk-on-gravel.mp3` },
    { id: 'droplets', label: 'Droplets', src: `${BASE}/droplets.mp3` },
    { id: 'jungle', label: 'Jungle', src: `${BASE}/jungle.mp3` },
  ],
}
