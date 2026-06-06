import { nature } from './categories/nature'
import { rain } from './categories/rain'
import { animals } from './categories/animals'
import { urban } from './categories/urban'
import { places } from './categories/places'
import { transport } from './categories/transport'
import { things } from './categories/things'
import { noise } from './categories/noise'
import type { Categories } from '../types'

export const categories: Categories = [
  nature, rain, animals, urban,
  places, transport, things, noise,
]

export function getAllSounds() {
  return categories.flatMap(c => c.sounds)
}

export function getSoundById(id: string) {
  return getAllSounds().find(s => s.id === id)
}
