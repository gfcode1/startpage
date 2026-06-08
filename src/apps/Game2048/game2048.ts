export const GRID_SIZE = 4

export interface Tile {
  id: number
  value: number
  row: number
  col: number
  previousRow?: number
  previousCol?: number
  mergedFrom?: boolean
  isNew?: boolean
}

export type Grid = (Tile | null)[][]

export interface MoveResult {
  grid: Grid
  score: number
  moved: boolean
  won: boolean
  gameOver: boolean
}

let nextId = 1

export function resetIdCounter(): void {
  nextId = 1
}

export function newTileId(): number {
  return nextId++
}

export function createGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(t => (t ? { ...t } : null)))
}

export function serializeGrid(grid: Grid): string {
  return JSON.stringify(grid.map(row =>
    row.map(t => (t ? { id: t.id, value: t.value, row: t.row, col: t.col } : null))
  ))
}

export function deserializeGrid(data: string): Grid | null {
  try {
    const raw = JSON.parse(data)
    if (!Array.isArray(raw) || raw.length !== GRID_SIZE) return null
    const grid = createGrid()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = raw[r][c]
        if (t) {
          grid[r][c] = { id: t.id, value: t.value, row: t.row, col: t.col }
          if (t.id >= nextId) nextId = t.id + 1
        }
      }
    }
    return grid
  } catch (e) {
    console.warn('game2048: deserializeGrid failed', e)
    return null
  }
}

function emptyCells(grid: Grid): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) cells.push({ row: r, col: c })
    }
  }
  return cells
}

export function addRandomTile(grid: Grid, id?: number): Tile | null {
  const cells = emptyCells(grid)
  if (cells.length === 0) return null
  const { row, col } = cells[Math.floor(Math.random() * cells.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  const tile: Tile = { id: id ?? newTileId(), value, row, col, isNew: true }
  grid[row][col] = tile
  return tile
}

function slideLine(line: (Tile | null)[]): {
  tiles: (Tile | null)[]
  score: number
  changed: boolean
} {
  const compact: Tile[] = []
  for (const t of line) {
    if (t) compact.push(t)
  }

  const result: (Tile | null)[] = new Array(GRID_SIZE).fill(null)
  let score = 0
  let i = 0
  let ri = 0

  while (i < compact.length) {
    if (
      i + 1 < compact.length &&
      compact[i].value === compact[i + 1].value
    ) {
      const val = compact[i].value * 2
      const merged = compact[i]
      const mergedTile: Tile = {
        id: newTileId(),
        value: val,
        row: merged.row,
        col: merged.col,
        previousRow: merged.row,
        previousCol: merged.col,
        mergedFrom: true,
      }
      result[ri] = mergedTile
      score += val
      i += 2
    } else {
      const t = compact[i]
      result[ri] = t
      t.previousRow = t.row
      t.previousCol = t.col
      i++
    }
    ri++
  }

  const changed = result.some((t, idx) => {
    if (!t) return line[idx] !== null
    if (!line[idx]) return true
    return line[idx]!.id !== t.id || line[idx]!.value !== t.value
  })

  return { tiles: result, score, changed }
}

export function move(grid: Grid, direction: 'up' | 'down' | 'left' | 'right'): MoveResult {
  const newGrid = createGrid()
  let totalScore = 0
  let moved = false

  for (let i = 0; i < GRID_SIZE; i++) {
    let line: (Tile | null)[] = []
    for (let j = 0; j < GRID_SIZE; j++) {
      const r = direction === 'left' || direction === 'right' ? i : j
      const c = direction === 'left' || direction === 'right' ? j : i
      line.push(grid[r][c])
    }

    if (direction === 'right' || direction === 'down') {
      line = line.reverse()
    }

    const result = slideLine(line)
    let finalTiles = result.tiles
    if (direction === 'right' || direction === 'down') {
      finalTiles = [...finalTiles].reverse()
    }

    totalScore += result.score
    if (result.changed) moved = true

    for (let j = 0; j < GRID_SIZE; j++) {
      const t = finalTiles[j]
      if (t) {
        const r = direction === 'left' || direction === 'right' ? i : j
        const c = direction === 'left' || direction === 'right' ? j : i
        t.row = r
        t.col = c
        newGrid[r][c] = t
      }
    }
  }

  if (moved) {
    const finalGrid = cloneGrid(newGrid)
    addRandomTile(finalGrid)
    const won = hasWon(finalGrid)
    const gameOver = isGameOver(finalGrid)
    return { grid: finalGrid, score: totalScore, moved, won, gameOver }
  }

  return {
    grid,
    score: 0,
    moved: false,
    won: false,
    gameOver: !canMove(grid),
  }
}

export function canMove(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) return true
      const v = grid[r][c]!.value
      if (c + 1 < GRID_SIZE && grid[r][c + 1]?.value === v) return true
      if (r + 1 < GRID_SIZE && grid[r + 1][c]?.value === v) return true
    }
  }
  return false
}

export function isGameOver(grid: Grid): boolean {
  return !canMove(grid)
}

export function hasWon(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]?.value === 2048) return true
    }
  }
  return false
}

export function tileAlpha(value: number): number {
  const map: Record<number, number> = {
    2: 0.15, 4: 0.25, 8: 0.40, 16: 0.55, 32: 0.70, 64: 0.85,
    128: 1.0, 256: 1.0, 512: 1.0, 1024: 1.0, 2048: 1.0, 4096: 1.0,
  }
  if (value <= 4096) return map[value] ?? 1.0
  return 1.0
}

