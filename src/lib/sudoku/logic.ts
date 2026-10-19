import { bit, lowestValue, popcount, type Geometry } from "./geometry"

export type Technique =
  | "naked-single"
  | "hidden-single"
  | "locked-candidates"
  | "naked-pair"
  | "hidden-pair"
  | "naked-triple"
  | "hidden-triple"
  | "x-wing"
  | "y-wing"
  | "swordfish"

export const TECHNIQUE_LEVEL: Record<Technique, number> = {
  "naked-single": 1,
  "hidden-single": 1,
  "locked-candidates": 2,
  "naked-pair": 3,
  "hidden-pair": 3,
  "naked-triple": 3,
  "hidden-triple": 4,
  "x-wing": 4,
  "y-wing": 4,
  swordfish: 4,
}

const TECHNIQUE_SCORE: Record<Technique, number> = {
  "naked-single": 1,
  "hidden-single": 1.5,
  "locked-candidates": 6,
  "naked-pair": 10,
  "hidden-pair": 14,
  "naked-triple": 18,
  "hidden-triple": 24,
  "x-wing": 28,
  "y-wing": 30,
  swordfish: 36,
}

export const GUESS_LEVEL = 5

export type UnitKind = "row" | "col" | "box"

export interface Step {
  technique: Technique
  index?: number
  value?: number
  unit?: UnitKind
  eliminations?: number
}

export interface GradeResult {
  solved: boolean
  level: number
  score: number
  steps: number
  techniques: Partial<Record<Technique, number>>
  values: number[]
  candidates: number[]
}

class LogicBoard {
  values: number[]
  cands: Int32Array
  g: Geometry
  valid = true

  constructor(grid: ArrayLike<number>, g: Geometry) {
    this.g = g
    this.values = Array.from(grid)
    this.cands = new Int32Array(g.cells)
    for (let i = 0; i < g.cells; i++) {
      if (this.values[i]) continue
      let used = 0
      for (const p of g.peers[i]) if (this.values[p]) used |= bit(this.values[p])
      this.cands[i] = g.full & ~used
      if (!this.cands[i]) this.valid = false
    }
  }

  place(i: number, v: number) {
    this.values[i] = v
    this.cands[i] = 0
    const b = ~bit(v)
    for (const p of this.g.peers[i]) {
      if (this.values[p]) continue
      this.cands[p] &= b
      if (!this.cands[p]) this.valid = false
    }
  }

  eliminate(i: number, mask: number): boolean {
    if (this.values[i] || !(this.cands[i] & mask)) return false
    this.cands[i] &= ~mask
    if (!this.cands[i]) this.valid = false
    return true
  }

  isSolved(): boolean {
    for (let i = 0; i < this.g.cells; i++) if (!this.values[i]) return false
    return true
  }

  unitKind(u: number): UnitKind {
    const n = this.g.n
    return u < n ? "row" : u < 2 * n ? "col" : "box"
  }

  nakedSingle(): Step | null {
    for (let i = 0; i < this.g.cells; i++) {
      if (!this.values[i] && popcount(this.cands[i]) === 1) {
        const v = lowestValue(this.cands[i])
        this.place(i, v)
        return { technique: "naked-single", index: i, value: v }
      }
    }
    return null
  }

  hiddenSingle(): Step | null {
    const { units, n } = this.g
    const order = [...range(2 * n, 3 * n), ...range(0, 2 * n)]
    for (const u of order) {
      const unit = units[u]
      for (let v = 1; v <= n; v++) {
        const b = bit(v)
        let found = -1
        let count = 0
        for (const i of unit) {
          if (this.values[i] === v) {
            count = -1
            break
          }
          if (!this.values[i] && this.cands[i] & b) {
            found = i
            count++
            if (count > 1) break
          }
        }
        if (count === 1) {
          this.place(found, v)
          return { technique: "hidden-single", index: found, value: v, unit: this.unitKind(u) }
        }
      }
    }
    return null
  }

  lockedCandidates(): Step | null {
    const { units, n, rowOf, colOf, boxOf } = this.g
    let eliminations = 0
    for (let b = 0; b < n; b++) {
      const box = units[2 * n + b]
      for (let v = 1; v <= n; v++) {
        const m = bit(v)
        let row = -2
        let col = -2
        for (const i of box) {
          if (this.values[i] || !(this.cands[i] & m)) continue
          row = row === -2 || row === rowOf[i] ? rowOf[i] : -1
          col = col === -2 || col === colOf[i] ? colOf[i] : -1
        }
        if (row >= 0) {
          for (const i of units[row]) if (boxOf[i] !== b && this.eliminate(i, m)) eliminations++
        }
        if (col >= 0) {
          for (const i of units[n + col]) if (boxOf[i] !== b && this.eliminate(i, m)) eliminations++
        }
        if (eliminations) return { technique: "locked-candidates", eliminations }
      }
    }
    for (let u = 0; u < 2 * n; u++) {
      const line = units[u]
      const isRow = u < n
      for (let v = 1; v <= n; v++) {
        const m = bit(v)
        let box = -2
        for (const i of line) {
          if (this.values[i] || !(this.cands[i] & m)) continue
          box = box === -2 || box === boxOf[i] ? boxOf[i] : -1
        }
        if (box < 0) continue
        for (const i of units[2 * n + box]) {
          const inLine = isRow ? rowOf[i] === u : colOf[i] === u - n
          if (!inLine && this.eliminate(i, m)) eliminations++
        }
        if (eliminations) return { technique: "locked-candidates", eliminations }
      }
    }
    return null
  }

  nakedSubset(k: number): Step | null {
    const { units } = this.g
    for (const unit of units) {
      const open = unit.filter((i) => !this.values[i])
      if (open.length <= k) continue
      const pool = open.filter((i) => popcount(this.cands[i]) <= k)
      for (const combo of combinations(pool, k)) {
        let union = 0
        for (const i of combo) union |= this.cands[i]
        if (popcount(union) !== k) continue
        let eliminations = 0
        for (const i of open) {
          if (!combo.includes(i) && this.eliminate(i, union)) eliminations++
        }
        if (eliminations) {
          return { technique: k === 2 ? "naked-pair" : "naked-triple", eliminations }
        }
      }
    }
    return null
  }

  hiddenSubset(k: number): Step | null {
    const { units, n } = this.g
    for (const unit of units) {
      const open = unit.filter((i) => !this.values[i])
      if (open.length <= k) continue
      const positions = new Map<number, number>()
      for (let v = 1; v <= n; v++) {
        const m = bit(v)
        let pos = 0
        for (let j = 0; j < open.length; j++) if (this.cands[open[j]] & m) pos |= 1 << j
        const c = popcount(pos)
        if (c >= 2 && c <= k) positions.set(v, pos)
      }
      const valuesList = [...positions.keys()]
      for (const combo of combinations(valuesList, k)) {
        let union = 0
        let valueMask = 0
        for (const v of combo) {
          union |= positions.get(v)!
          valueMask |= bit(v)
        }
        if (popcount(union) !== k) continue
        let eliminations = 0
        for (let j = 0; j < open.length; j++) {
          if (union & (1 << j) && this.eliminate(open[j], ~valueMask & this.g.full)) eliminations++
        }
        if (eliminations) {
          return { technique: k === 2 ? "hidden-pair" : "hidden-triple", eliminations }
        }
      }
    }
    return null
  }

  fish(k: number): Step | null {
    const { n } = this.g
    for (let v = 1; v <= n; v++) {
      const m = bit(v)
      for (const byRow of [true, false]) {
        const lines: { line: number; mask: number }[] = []
        for (let a = 0; a < n; a++) {
          let mask = 0
          for (let b = 0; b < n; b++) {
            const i = byRow ? a * n + b : b * n + a
            if (!this.values[i] && this.cands[i] & m) mask |= 1 << b
          }
          const c = popcount(mask)
          if (c >= 2 && c <= k) lines.push({ line: a, mask })
        }
        for (const combo of combinations(lines, k)) {
          let union = 0
          for (const l of combo) union |= l.mask
          if (popcount(union) !== k) continue
          const baseLines = new Set(combo.map((l) => l.line))
          let eliminations = 0
          for (let b = 0; b < n; b++) {
            if (!(union & (1 << b))) continue
            for (let a = 0; a < n; a++) {
              if (baseLines.has(a)) continue
              const i = byRow ? a * n + b : b * n + a
              if (this.eliminate(i, m)) eliminations++
            }
          }
          if (eliminations) return { technique: k === 2 ? "x-wing" : "swordfish", eliminations }
        }
      }
    }
    return null
  }

  yWing(): Step | null {
    const { cells, peers, peerMatrix } = this.g
    for (let pivot = 0; pivot < cells; pivot++) {
      const pm = this.cands[pivot]
      if (this.values[pivot] || popcount(pm) !== 2) continue
      const wings = peers[pivot].filter((p) => {
        const c = this.cands[p]
        return !this.values[p] && popcount(c) === 2 && popcount(c & pm) === 1
      })
      for (let x = 0; x < wings.length; x++) {
        for (let y = x + 1; y < wings.length; y++) {
          const a = wings[x]
          const b = wings[y]
          const ca = this.cands[a]
          const cb = this.cands[b]
          if ((ca & pm) === (cb & pm)) continue
          const shared = ca & cb & ~pm
          if (popcount(shared) !== 1) continue
          let eliminations = 0
          for (let i = 0; i < cells; i++) {
            if (i === a || i === b || i === pivot) continue
            if (peerMatrix[i * cells + a] && peerMatrix[i * cells + b] && this.eliminate(i, shared)) eliminations++
          }
          if (eliminations) return { technique: "y-wing", eliminations }
        }
      }
    }
    return null
  }

  nextStep(maxLevel = Infinity): Step | null {
    return (
      this.nakedSingle() ??
      this.hiddenSingle() ??
      (maxLevel >= 2 ? this.lockedCandidates() : null) ??
      (maxLevel >= 3 ? this.nakedSubset(2) ?? this.hiddenSubset(2) ?? this.nakedSubset(3) : null) ??
      (maxLevel >= 4 ? this.hiddenSubset(3) ?? this.fish(2) ?? this.yWing() ?? this.fish(3) : null)
    )
  }
}

function range(from: number, to: number): number[] {
  const out: number[] = []
  for (let i = from; i < to; i++) out.push(i)
  return out
}

function* combinations<T>(items: T[], k: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === k) {
    yield acc.slice()
    return
  }
  for (let i = start; i <= items.length - (k - acc.length); i++) {
    acc.push(items[i])
    yield* combinations(items, k, i + 1, acc)
    acc.pop()
  }
}

export function grade(grid: ArrayLike<number>, g: Geometry, maxLevel = Infinity): GradeResult {
  const board = new LogicBoard(grid, g)
  const techniques: Partial<Record<Technique, number>> = {}
  let level = 0
  let score = 0
  let steps = 0
  while (board.valid && !board.isSolved()) {
    const step = board.nextStep(maxLevel)
    if (!step) break
    steps++
    techniques[step.technique] = (techniques[step.technique] ?? 0) + 1
    level = Math.max(level, TECHNIQUE_LEVEL[step.technique])
    score += TECHNIQUE_SCORE[step.technique]
  }
  const solved = board.valid && board.isSolved()
  if (!solved) {
    level = GUESS_LEVEL
    score += 100
  }
  return { solved, level, score, steps, techniques, values: board.values, candidates: Array.from(board.cands) }
}

export interface Hint {
  index: number
  value: number
  technique: Technique | "reveal"
  unit?: UnitKind
}

export function findSingle(grid: ArrayLike<number>, g: Geometry, prefer?: number): Hint | null {
  const board = new LogicBoard(grid, g)
  if (!board.valid) return null
  if (prefer !== undefined && !board.values[prefer] && popcount(board.cands[prefer]) === 1) {
    return { index: prefer, value: lowestValue(board.cands[prefer]), technique: "naked-single" }
  }
  const hidden = new LogicBoard(grid, g).hiddenSingle()
  const naked = board.nakedSingle()
  const step = hidden?.unit === "box" ? hidden : naked ?? hidden
  if (!step || step.index === undefined || step.value === undefined) return null
  return { index: step.index, value: step.value, technique: step.technique, unit: step.unit }
}

export function candidatesFor(grid: ArrayLike<number>, g: Geometry): number[] {
  return Array.from(new LogicBoard(grid, g).cands)
}

