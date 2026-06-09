export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_CONFIG = {
  easy: { rows: 3, cols: 3, label: '3×3' },
  medium: { rows: 4, cols: 4, label: '4×4' },
  hard: { rows: 5, cols: 5, label: '5×5' },
} as const

