import { generatePuzzle } from "../src/lib/sudoku/generator"
import { DIFFICULTIES, SIZES, getGeometry, bit } from "../src/lib/sudoku/geometry"
import { countSolutions } from "../src/lib/sudoku/solver"

const runs = Number(process.argv[2] ?? 6)
const onlySize = process.argv[3] ? Number(process.argv[3]) : null

function validSolution(sol: number[], size: number) {
  const g = getGeometry(size as any)
  for (const unit of g.units) {
    let m = 0
    for (const i of unit) m |= bit(sol[i])
    if (m !== g.full) return false
  }
  return true
}

for (const size of SIZES) {
  if (onlySize && size !== onlySize) continue
  for (const d of DIFFICULTIES) {
    const times: number[] = []
    const levels: number[] = []
    const clues: number[] = []
    let ok = 0
    for (let r = 0; r < runs; r++) {
      const t = performance.now()
      const p = generatePuzzle(size, d)
      times.push(performance.now() - t)
      levels.push(p.level)
      clues.push(p.clues)
      const g = getGeometry(size)
      const unique = countSolutions(p.puzzle, g, 2) === 1
      const consistent = p.puzzle.every((v, i) => !v || v === p.solution[i])
      if (unique && consistent && validSolution(p.solution, size)) ok++
    }
    const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0)
    console.log(`${size}x${size} ${d.padEnd(8)} ok=${ok}/${runs} avg=${avg(times)}ms max=${Math.max(...times).toFixed(0)}ms levels=${levels.join(",")} clues=${clues.join(",")}`)
  }
}
