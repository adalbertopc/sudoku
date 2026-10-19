import { generatePuzzle, type Puzzle } from "./generator"
import type { Difficulty, GridSize } from "./geometry"

export interface GenerateRequest {
  size: GridSize
  difficulty: Difficulty
  count: number
}

export type GenerateMessage =
  | { type: "progress"; done: number; total: number; puzzle: Puzzle }
  | { type: "done"; puzzles: Puzzle[] }
  | { type: "error"; message: string }

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { size, difficulty, count } = event.data
  try {
    const puzzles: Puzzle[] = []
    for (let i = 0; i < count; i++) {
      const puzzle = generatePuzzle(size, difficulty)
      puzzles.push(puzzle)
      self.postMessage({ type: "progress", done: i + 1, total: count, puzzle } satisfies GenerateMessage)
    }
    self.postMessage({ type: "done", puzzles } satisfies GenerateMessage)
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) } satisfies GenerateMessage)
  }
}
