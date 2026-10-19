export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export const KEYS = {
  game: "sudoku:game",
  settings: "sudoku:settings",
  stats: "sudoku:stats",
  preferences: "sudoku:preferences",
  print: "sudoku:print",
} as const
