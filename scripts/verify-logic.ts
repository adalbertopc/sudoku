import { getGeometry, bit, SIZES } from "../src/lib/sudoku/geometry"
import { grade } from "../src/lib/sudoku/logic"
import { createRng } from "../src/lib/sudoku/random"
import { countSolutions, randomSolution } from "../src/lib/sudoku/solver"

let bad = 0
const usage: Record<string, number> = {}
for (const size of SIZES) {
  const g = getGeometry(size)
  for (let seed = 1; seed <= (size === 12 ? 30 : 150); seed++) {
    const rng = createRng(seed * 7919 + size)
    const sol = randomSolution(g, rng)
    const puz = sol.slice()
    const order = [...Array(g.cells).keys()].sort(() => rng() - 0.5)
    for (const i of order) {
      const v = puz[i]
      puz[i] = 0
      if (countSolutions(puz, g, 2) !== 1) puz[i] = v
    }
    const r = grade(puz, g)
    for (const [k, c] of Object.entries(r.techniques)) usage[k] = (usage[k] ?? 0) + c!
    for (let i = 0; i < g.cells; i++) {
      if (r.values[i] && r.values[i] !== sol[i]) { bad++; break }
      if (!r.values[i] && !(r.candidates[i] & bit(sol[i]))) { bad++; break }
    }
  }
}
console.log("errores:", bad)
console.log(usage)
