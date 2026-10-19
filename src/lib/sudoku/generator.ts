import { getGeometry, type Difficulty, type Geometry, type GridSize } from "./geometry"
import { grade, GUESS_LEVEL } from "./logic"
import { createRng, randomSeed, shuffle, type Rng } from "./random"
import { randomSolution, solve } from "./solver"

export interface Puzzle {
  size: GridSize
  difficulty: Difficulty
  puzzle: number[]
  solution: number[]
  clues: number
  level: number
  score: number
  seed: number
}

interface Profile {
  minLevel: number
  maxLevel: number
  minClues: number
  maxClues: number
  symmetric: boolean
  budgetMs: number
}

const CLUE_RATIOS: Record<Difficulty, [number, number]> = {
  facil: [0.47, 0.56],
  medio: [0.37, 0.46],
  dificil: [0, 0.4],
  experto: [0, 0.36],
}

const LEVELS: Record<Difficulty, [number, number]> = {
  facil: [1, 1],
  medio: [1, 2],
  dificil: [2, 3],
  experto: [4, 4],
}

const SMALL_LEVELS: Record<Difficulty, [number, number]> = {
  facil: [1, 1],
  medio: [1, 1],
  dificil: [1, 2],
  experto: [1, GUESS_LEVEL],
}

const SMALL_RATIOS: Record<Difficulty, [number, number]> = {
  facil: [0.5, 0.6],
  medio: [0.4, 0.5],
  dificil: [0.3, 0.42],
  experto: [0, 0.34],
}

function profileFor(size: GridSize, difficulty: Difficulty): Profile {
  const cells = size * size
  const small = size <= 6
  const [minLevel, maxLevel] = small ? SMALL_LEVELS[difficulty] : LEVELS[difficulty]
  const [minRatio, maxRatio] = small ? SMALL_RATIOS[difficulty] : CLUE_RATIOS[difficulty]
  const budgetBase = size >= 12 ? 3500 : size >= 9 ? 2500 : 600
  return {
    minLevel,
    maxLevel,
    minClues: Math.ceil(cells * minRatio),
    maxClues: Math.floor(cells * maxRatio),
    symmetric: difficulty !== "experto" || size < 9,
    budgetMs: difficulty === "experto" || difficulty === "dificil" ? budgetBase : budgetBase / 2,
  }
}

function removalOrder(g: Geometry, rng: Rng, symmetric: boolean): number[][] {
  const groups: number[][] = []
  const seen = new Uint8Array(g.cells)
  for (let i = 0; i < g.cells; i++) {
    if (seen[i]) continue
    const mirror = g.cells - 1 - i
    seen[i] = 1
    if (symmetric && mirror !== i) {
      seen[mirror] = 1
      groups.push([i, mirror])
    } else {
      groups.push([i])
    }
  }
  return shuffle(groups, rng)
}

function dig(g: Geometry, solution: number[], profile: Profile, rng: Rng): number[] {
  const puzzle = solution.slice()
  let clues = g.cells
  const gradeLimit = profile.maxLevel >= GUESS_LEVEL ? Infinity : profile.maxLevel
  for (const group of removalOrder(g, rng, profile.symmetric)) {
    if (clues - group.length < profile.minClues) continue
    for (const i of group) puzzle[i] = 0
    const check = solve(puzzle, g, { limit: 2, maxNodes: g.n >= 12 ? 20000 : 200000 })
    let ok = !check.aborted && check.count === 1
    if (ok && gradeLimit !== Infinity) {
      ok = grade(puzzle, g, gradeLimit).solved
    }
    if (ok) {
      clues -= group.length
    } else {
      for (const i of group) puzzle[i] = solution[i]
    }
  }
  return puzzle
}

function fitness(level: number, clues: number, score: number, profile: Profile): number {
  const levelGap =
    level < profile.minLevel ? profile.minLevel - level : level > profile.maxLevel ? level - profile.maxLevel : 0
  const clueGap =
    clues < profile.minClues ? profile.minClues - clues : clues > profile.maxClues ? clues - profile.maxClues : 0
  const preferHard = profile.minLevel >= 2 ? -score / 1000 : 0
  return levelGap * 100 + clueGap + preferHard
}

export function generatePuzzle(size: GridSize, difficulty: Difficulty, seed = randomSeed()): Puzzle {
  const g = getGeometry(size)
  const profile = profileFor(size, difficulty)
  const rng = createRng(seed)
  const started = Date.now()
  let best: { puzzle: number[]; solution: number[]; level: number; score: number; clues: number; fit: number } | null =
    null
  let attempts = 0
  while (attempts < 400) {
    attempts++
    const solution = randomSolution(g, rng)
    const puzzle = dig(g, solution, profile, rng)
    const clues = puzzle.reduce((acc, v) => acc + (v ? 1 : 0), 0)
    const result = grade(puzzle, g)
    const fit = fitness(result.level, clues, result.score, profile)
    if (!best || fit < best.fit) {
      best = { puzzle, solution, level: result.level, score: result.score, clues, fit }
    }
    if (fit <= 0) break
    if (Date.now() - started > profile.budgetMs) break
  }
  const chosen = best!
  return {
    size,
    difficulty,
    puzzle: chosen.puzzle,
    solution: chosen.solution,
    clues: chosen.clues,
    level: chosen.level,
    score: Math.round(chosen.score),
    seed,
  }
}
