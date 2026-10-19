import type { Puzzle } from "./generator"
import { bit, getGeometry, popcount, type Difficulty, type GridSize } from "./geometry"
import { candidatesFor, findSingle, type Hint } from "./logic"

interface Change {
  i: number
  v: number
  n: number
}

export interface GameState {
  version: 1
  id: string
  size: GridSize
  difficulty: Difficulty
  level: number
  givens: number[]
  solution: number[]
  values: number[]
  notes: number[]
  hinted: number[]
  elapsed: number
  hints: number
  mistakes: number
  completed: boolean
  history: Change[][]
  lastHint: (Hint & { fixed?: boolean }) | null
}

export type GameAction =
  | { type: "input"; index: number; value: number; notesMode: boolean; autoRemoveNotes: boolean }
  | { type: "erase"; index: number }
  | { type: "undo" }
  | { type: "hint"; index: number | null; autoRemoveNotes: boolean }
  | { type: "fill-notes" }
  | { type: "clear-notes" }
  | { type: "tick"; ms: number }
  | { type: "restart" }
  | { type: "dismiss-hint" }

const HISTORY_LIMIT = 300

export function createGame(puzzle: Puzzle): GameState {
  return {
    version: 1,
    id: `${puzzle.seed.toString(36)}-${Date.now().toString(36)}`,
    size: puzzle.size,
    difficulty: puzzle.difficulty,
    level: puzzle.level,
    givens: puzzle.puzzle.slice(),
    solution: puzzle.solution.slice(),
    values: puzzle.puzzle.slice(),
    notes: new Array(puzzle.puzzle.length).fill(0),
    hinted: [],
    elapsed: 0,
    hints: 0,
    mistakes: 0,
    completed: false,
    history: [],
    lastHint: null,
  }
}

export function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false
  const s = value as GameState
  const cells = s.size * s.size
  return (
    s.version === 1 &&
    Array.isArray(s.values) &&
    s.values.length === cells &&
    Array.isArray(s.givens) &&
    s.givens.length === cells &&
    Array.isArray(s.solution) &&
    s.solution.length === cells &&
    Array.isArray(s.notes) &&
    s.notes.length === cells
  )
}

interface Draft {
  values: number[]
  notes: number[]
  changes: Change[]
  touched: Set<number>
}

function draftOf(state: GameState): Draft {
  return { values: state.values.slice(), notes: state.notes.slice(), changes: [], touched: new Set() }
}

function record(d: Draft, i: number) {
  if (d.touched.has(i)) return
  d.touched.add(i)
  d.changes.push({ i, v: d.values[i], n: d.notes[i] })
}

function setValue(d: Draft, state: GameState, i: number, v: number, autoRemoveNotes: boolean) {
  record(d, i)
  d.values[i] = v
  d.notes[i] = 0
  if (!v || !autoRemoveNotes) return
  const g = getGeometry(state.size)
  const mask = ~bit(v)
  for (const p of g.peers[i]) {
    if (d.notes[p] & ~mask) {
      record(d, p)
      d.notes[p] &= mask
    }
  }
}

function commit(state: GameState, d: Draft, extra: Partial<GameState> = {}): GameState {
  if (!d.changes.length && !Object.keys(extra).length) return state
  const history = d.changes.length ? [...state.history, d.changes].slice(-HISTORY_LIMIT) : state.history
  const completed = d.values.every((v, i) => v === state.solution[i])
  return { ...state, values: d.values, notes: d.notes, history, completed, ...extra }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "tick") {
    if (state.completed) return state
    return { ...state, elapsed: state.elapsed + action.ms }
  }
  if (action.type === "dismiss-hint") return state.lastHint ? { ...state, lastHint: null } : state
  if (action.type === "restart") {
    return {
      ...state,
      values: state.givens.slice(),
      notes: new Array(state.givens.length).fill(0),
      hinted: [],
      elapsed: 0,
      hints: 0,
      mistakes: 0,
      completed: false,
      history: [],
      lastHint: null,
    }
  }
  if (state.completed) return state

  switch (action.type) {
    case "input": {
      const { index, value } = action
      if (state.givens[index]) return state
      const d = draftOf(state)
      if (action.notesMode) {
        if (d.values[index]) return state
        record(d, index)
        d.notes[index] ^= bit(value)
        return commit(state, d, { lastHint: null })
      }
      const next = d.values[index] === value ? 0 : value
      setValue(d, state, index, next, action.autoRemoveNotes)
      const wrong = next !== 0 && next !== state.solution[index]
      return commit(state, d, { mistakes: state.mistakes + (wrong ? 1 : 0), lastHint: null })
    }
    case "erase": {
      const { index } = action
      if (state.givens[index]) return state
      if (!state.values[index] && !state.notes[index]) return state
      const d = draftOf(state)
      record(d, index)
      d.values[index] = 0
      d.notes[index] = 0
      return commit(state, d, { lastHint: null })
    }
    case "undo": {
      const last = state.history[state.history.length - 1]
      if (!last) return state
      const values = state.values.slice()
      const notes = state.notes.slice()
      for (const c of last) {
        values[c.i] = c.v
        notes[c.i] = c.n
      }
      return { ...state, values, notes, history: state.history.slice(0, -1), lastHint: null }
    }
    case "fill-notes": {
      const g = getGeometry(state.size)
      const correct = state.values.map((v, i) => (v === state.solution[i] ? v : 0))
      const cands = candidatesFor(correct, g)
      const d = draftOf(state)
      for (let i = 0; i < g.cells; i++) {
        if (d.values[i] || d.notes[i] === cands[i]) continue
        record(d, i)
        d.notes[i] = cands[i]
      }
      return commit(state, d)
    }
    case "clear-notes": {
      const d = draftOf(state)
      d.notes.forEach((n, i) => {
        if (!n) return
        record(d, i)
        d.notes[i] = 0
      })
      return commit(state, d)
    }
    case "hint":
      return applyHint(state, action.index, action.autoRemoveNotes)
  }
}

function applyHint(state: GameState, selected: number | null, autoRemoveNotes: boolean): GameState {
  const g = getGeometry(state.size)
  const wrong = state.values.findIndex((v, i) => v && v !== state.solution[i])
  const selectedWrong = selected !== null && state.values[selected] && state.values[selected] !== state.solution[selected]
  let hint: (Hint & { fixed?: boolean }) | null = null

  if (selectedWrong) {
    hint = { index: selected, value: state.solution[selected], technique: "reveal", fixed: true }
  } else if (wrong >= 0) {
    hint = { index: wrong, value: state.solution[wrong], technique: "reveal", fixed: true }
  } else {
    const prefer = selected !== null && !state.values[selected] ? selected : undefined
    hint = findSingle(state.values, g, prefer)
    if (!hint) {
      let target = prefer ?? -1
      if (target < 0) {
        const cands = candidatesFor(state.values, g)
        let best = 99
        for (let i = 0; i < g.cells; i++) {
          if (state.values[i]) continue
          const c = popcount(cands[i])
          if (c < best) {
            best = c
            target = i
          }
        }
      }
      if (target < 0) return state
      hint = { index: target, value: state.solution[target], technique: "reveal" }
    }
  }

  const d = draftOf(state)
  setValue(d, state, hint.index, hint.value, autoRemoveNotes)
  return commit(state, d, {
    hints: state.hints + 1,
    hinted: state.hinted.includes(hint.index) ? state.hinted : [...state.hinted, hint.index],
    lastHint: hint,
  })
}

export function findConflicts(values: number[], size: GridSize): Set<number> {
  const g = getGeometry(size)
  const conflicts = new Set<number>()
  for (const unit of g.units) {
    const seen = new Map<number, number[]>()
    for (const i of unit) {
      const v = values[i]
      if (!v) continue
      const list = seen.get(v)
      if (list) list.push(i)
      else seen.set(v, [i])
    }
    for (const list of seen.values()) if (list.length > 1) list.forEach((i) => conflicts.add(i))
  }
  return conflicts
}

export function remainingCounts(values: number[], size: number): number[] {
  const counts = new Array(size + 1).fill(size)
  for (const v of values) if (v) counts[v]--
  return counts
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h ? 2 : 1, "0")
  const ss = String(s).padStart(2, "0")
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
