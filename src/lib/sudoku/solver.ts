import { bit, maskValues, popcount, type Geometry } from "./geometry"
import { shuffle, type Rng } from "./random"

export interface SolveOptions {
  limit?: number
  rng?: Rng
  maxNodes?: number
}

export interface SolveResult {
  count: number
  solution: number[] | null
  aborted: boolean
}

export function solve(grid: ArrayLike<number>, geometry: Geometry, options: SolveOptions = {}): SolveResult {
  const { n, cells, full, rowOf, colOf, boxOf } = geometry
  const limit = options.limit ?? 2
  const maxNodes = options.maxNodes ?? Infinity
  const rng = options.rng
  const values = Array.from(grid)
  const rows = new Int32Array(n)
  const cols = new Int32Array(n)
  const boxes = new Int32Array(n)
  const empties: number[] = []

  for (let i = 0; i < cells; i++) {
    const v = values[i]
    if (!v) {
      empties.push(i)
      continue
    }
    const b = bit(v)
    if ((rows[rowOf[i]] | cols[colOf[i]] | boxes[boxOf[i]]) & b) {
      return { count: 0, solution: null, aborted: false }
    }
    rows[rowOf[i]] |= b
    cols[colOf[i]] |= b
    boxes[boxOf[i]] |= b
  }

  let count = 0
  let nodes = 0
  let aborted = false
  let solution: number[] | null = null

  const search = (): boolean => {
    if (++nodes > maxNodes) {
      aborted = true
      return true
    }
    let best = -1
    let bestMask = 0
    let bestCount = 99
    for (let k = 0; k < empties.length; k++) {
      const i = empties[k]
      if (values[i]) continue
      const mask = full & ~(rows[rowOf[i]] | cols[colOf[i]] | boxes[boxOf[i]])
      const c = popcount(mask)
      if (c < bestCount) {
        best = i
        bestMask = mask
        bestCount = c
        if (c <= 1) break
      }
    }
    if (best === -1) {
      count++
      if (!solution) solution = values.slice()
      return count >= limit
    }
    if (bestCount === 0) return false
    const candidates = maskValues(bestMask)
    if (rng) shuffle(candidates, rng)
    const r = rowOf[best]
    const c = colOf[best]
    const bx = boxOf[best]
    for (const v of candidates) {
      const b = bit(v)
      values[best] = v
      rows[r] |= b
      cols[c] |= b
      boxes[bx] |= b
      if (search()) return true
      rows[r] &= ~b
      cols[c] &= ~b
      boxes[bx] &= ~b
      values[best] = 0
    }
    return false
  }

  search()
  return { count, solution, aborted }
}

export function countSolutions(grid: ArrayLike<number>, geometry: Geometry, limit = 2): number {
  return solve(grid, geometry, { limit }).count
}

export function randomSolution(geometry: Geometry, rng: Rng): number[] {
  const empty = new Array(geometry.cells).fill(0)
  const result = solve(empty, geometry, { limit: 1, rng })
  if (!result.solution) throw new Error("No se pudo generar una solución")
  return result.solution
}
