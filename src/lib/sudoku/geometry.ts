export const SIZES = [4, 6, 8, 9, 12] as const
export type GridSize = (typeof SIZES)[number]

export const DIFFICULTIES = ["facil", "medio", "dificil", "experto"] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export interface Layout {
  size: number
  boxRows: number
  boxCols: number
}

const LAYOUTS: Record<GridSize, Layout> = {
  4: { size: 4, boxRows: 2, boxCols: 2 },
  6: { size: 6, boxRows: 2, boxCols: 3 },
  8: { size: 8, boxRows: 2, boxCols: 4 },
  9: { size: 9, boxRows: 3, boxCols: 3 },
  12: { size: 12, boxRows: 3, boxCols: 4 },
}

export interface Geometry {
  layout: Layout
  n: number
  cells: number
  full: number
  rowOf: Int16Array
  colOf: Int16Array
  boxOf: Int16Array
  units: number[][]
  peers: number[][]
  peerMatrix: Uint8Array
}

const cache = new Map<number, Geometry>()

export function isGridSize(value: unknown): value is GridSize {
  return SIZES.includes(value as GridSize)
}

export function getGeometry(size: GridSize): Geometry {
  const cached = cache.get(size)
  if (cached) return cached
  const layout = LAYOUTS[size]
  const n = layout.size
  const cells = n * n
  const boxesPerRow = n / layout.boxCols
  const rowOf = new Int16Array(cells)
  const colOf = new Int16Array(cells)
  const boxOf = new Int16Array(cells)
  const units: number[][] = []
  for (let i = 0; i < 3 * n; i++) units.push([])
  for (let i = 0; i < cells; i++) {
    const r = Math.floor(i / n)
    const c = i % n
    const b = Math.floor(r / layout.boxRows) * boxesPerRow + Math.floor(c / layout.boxCols)
    rowOf[i] = r
    colOf[i] = c
    boxOf[i] = b
    units[r].push(i)
    units[n + c].push(i)
    units[2 * n + b].push(i)
  }
  const peerMatrix = new Uint8Array(cells * cells)
  const peers: number[][] = []
  for (let i = 0; i < cells; i++) {
    const list: number[] = []
    for (let j = 0; j < cells; j++) {
      if (i === j) continue
      if (rowOf[i] === rowOf[j] || colOf[i] === colOf[j] || boxOf[i] === boxOf[j]) {
        list.push(j)
        peerMatrix[i * cells + j] = 1
      }
    }
    peers.push(list)
  }
  const geometry: Geometry = {
    layout,
    n,
    cells,
    full: (1 << n) - 1,
    rowOf,
    colOf,
    boxOf,
    units,
    peers,
    peerMatrix,
  }
  cache.set(size, geometry)
  return geometry
}

export function bit(value: number): number {
  return 1 << (value - 1)
}

export function popcount(mask: number): number {
  mask = mask - ((mask >>> 1) & 0x55555555)
  mask = (mask & 0x33333333) + ((mask >>> 2) & 0x33333333)
  return (((mask + (mask >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

export function lowestValue(mask: number): number {
  return 32 - Math.clz32(mask & -mask)
}

export function maskValues(mask: number): number[] {
  const values: number[] = []
  while (mask) {
    const low = mask & -mask
    values.push(32 - Math.clz32(low))
    mask ^= low
  }
  return values
}

const SYMBOLS = "0123456789ABCDEFG"

export function symbol(value: number): string {
  return value ? SYMBOLS[value] : ""
}

export function valueFromKey(key: string, size: number): number | null {
  const upper = key.toUpperCase()
  const index = SYMBOLS.indexOf(upper)
  if (index < 1 || index > size || upper.length !== 1) return null
  return index
}
