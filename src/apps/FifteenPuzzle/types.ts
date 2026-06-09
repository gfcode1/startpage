export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_CONFIG = {
  easy: { rows: 3, cols: 3, label: '3×3', shuffleMoves: 30 },
  medium: { rows: 4, cols: 4, label: '4×4', shuffleMoves: 100 },
  hard: { rows: 5, cols: 5, label: '5×5', shuffleMoves: 200 },
} as const

export interface PhotoInfo {
  id: string
  author: string
  downloadUrl: string
}
