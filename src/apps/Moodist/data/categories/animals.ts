import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/animals'

export const animals: Category = {
  id: 'animals',
  title: 'Animals',
  icon: '\u{1F98D}',
  sounds: [
    { id: 'birds', label: 'Birds', src: `${BASE}/birds.mp3` },
    { id: 'seagulls', label: 'Seagulls', src: `${BASE}/seagulls.mp3` },
    { id: 'crickets', label: 'Crickets', src: `${BASE}/crickets.mp3` },
    { id: 'wolf', label: 'Wolf', src: `${BASE}/wolf.mp3` },
    { id: 'owl', label: 'Owl', src: `${BASE}/owl.mp3` },
    { id: 'frog', label: 'Frog', src: `${BASE}/frog.mp3` },
    { id: 'dog-barking', label: 'Dog Barking', src: `${BASE}/dog-barking.mp3` },
    { id: 'horse-gallop', label: 'Horse Gallop', src: `${BASE}/horse-gallop.mp3` },
    { id: 'cat-purring', label: 'Cat Purring', src: `${BASE}/cat-purring.mp3` },
    { id: 'crows', label: 'Crows', src: `${BASE}/crows.mp3` },
    { id: 'whale', label: 'Whale', src: `${BASE}/whale.mp3` },
    { id: 'beehive', label: 'Beehive', src: `${BASE}/beehive.mp3` },
    { id: 'woodpecker', label: 'Woodpecker', src: `${BASE}/woodpecker.mp3` },
    { id: 'chickens', label: 'Chickens', src: `${BASE}/chickens.mp3` },
    { id: 'cows', label: 'Cows', src: `${BASE}/cows.mp3` },
    { id: 'sheep', label: 'Sheep', src: `${BASE}/sheep.mp3` },
  ],
}
