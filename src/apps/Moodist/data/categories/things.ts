import type { Category } from '../../types'

const BASE = 'https://moodist.mvze.net/sounds/things'

export const things: Category = {
  id: 'things',
  title: 'Things',
  icon: 'grid',
  sounds: [
    { id: 'keyboard', label: 'Keyboard', src: `${BASE}/keyboard.mp3` },
    { id: 'typewriter', label: 'Typewriter', src: `${BASE}/typewriter.mp3` },
    { id: 'paper', label: 'Paper', src: `${BASE}/paper.mp3` },
    { id: 'clock', label: 'Clock', src: `${BASE}/clock.mp3` },
    { id: 'wind-chimes', label: 'Wind Chimes', src: `${BASE}/wind-chimes.mp3` },
    { id: 'singing-bowl', label: 'Singing Bowl', src: `${BASE}/singing-bowl.mp3` },
    { id: 'ceiling-fan', label: 'Ceiling Fan', src: `${BASE}/ceiling-fan.mp3` },
    { id: 'dryer', label: 'Dryer', src: `${BASE}/dryer.mp3` },
    { id: 'slide-projector', label: 'Slide Projector', src: `${BASE}/slide-projector.mp3` },
    { id: 'boiling-water', label: 'Boiling Water', src: `${BASE}/boiling-water.mp3` },
    { id: 'bubbles', label: 'Bubbles', src: `${BASE}/bubbles.mp3` },
    { id: 'tuning-radio', label: 'Tuning Radio', src: `${BASE}/tuning-radio.mp3` },
    { id: 'morse-code', label: 'Morse Code', src: `${BASE}/morse-code.mp3` },
    { id: 'washing-machine', label: 'Washing Machine', src: `${BASE}/washing-machine.mp3` },
    { id: 'vinyl-effect', label: 'Vinyl Effect', src: `${BASE}/vinyl-effect.mp3` },
    { id: 'windshield-wipers', label: 'Windshield Wipers', src: `${BASE}/windshield-wipers.mp3` },
  ],
}
