import { getGeometry, symbol, type GridSize } from "@/lib/sudoku/geometry"

export interface ShareResult {
  size: GridSize
  difficultyLabel: string
  time: string
  mistakes: number
  hints: number
  givens: number[]
  solution: number[]
  url: string
}

export interface ShareImageLabels {
  title: string
  time: string
  mistakes: string
  hints: string
  playAt: string
}

const SIZE = 1080
const FONT = "'Geist Variable', 'Helvetica Neue', Arial, sans-serif"
const INK = "#111111"
const MUTED = "#6b6b6b"
const ACCENT = "#0369a1"

export async function renderShareImage(result: ShareResult, labels: ShareImageLabels): Promise<Blob> {
  if (document.fonts) {
    await Promise.all([document.fonts.load(`700 76px ${FONT}`), document.fonts.load(`500 36px ${FONT}`)]).catch(() => {})
  }
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")!

  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0, "#ffffff")
  bg.addColorStop(1, "#f1f1f3")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  drawLogo(ctx, 80, 76, 44)
  ctx.fillStyle = MUTED
  ctx.font = `600 32px ${FONT}`
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  ctx.fillText("Sudoku", 140, 99)

  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = INK
  ctx.font = `700 72px ${FONT}`
  ctx.fillText(labels.title, 80, 222)
  ctx.fillStyle = MUTED
  ctx.font = `500 36px ${FONT}`
  ctx.fillText(`${result.size} × ${result.size} · ${result.difficultyLabel}`, 80, 278)

  drawGrid(ctx, result, 80, 330, 560)

  const statsX = 700
  const stats: [string, string][] = [
    [labels.time, result.time],
    [labels.mistakes, String(result.mistakes)],
    [labels.hints, String(result.hints)],
  ]
  stats.forEach(([label, value], k) => {
    const y = 330 + k * 196
    ctx.fillStyle = "#ffffff"
    roundRect(ctx, statsX, y, 300, 168, 24)
    ctx.fill()
    ctx.strokeStyle = "#e4e4e7"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.font = `700 64px ${FONT}`
    ctx.textAlign = "center"
    ctx.fillText(value, statsX + 150, y + 92)
    ctx.fillStyle = MUTED
    ctx.font = `500 28px ${FONT}`
    ctx.fillText(label, statsX + 150, y + 136)
  })

  const host = result.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  ctx.textAlign = "left"
  ctx.font = `500 30px ${FONT}`
  const prefix = `${labels.playAt} `
  const prefixWidth = ctx.measureText(prefix).width
  ctx.font = `700 30px ${FONT}`
  const hostWidth = ctx.measureText(host).width
  const start = (SIZE - prefixWidth - hostWidth) / 2
  ctx.fillStyle = MUTED
  ctx.font = `500 30px ${FONT}`
  ctx.fillText(prefix, start, SIZE - 64)
  ctx.fillStyle = INK
  ctx.font = `700 30px ${FONT}`
  ctx.fillText(host, start + prefixWidth, SIZE - 64)

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas"))), "image/png"),
  )
}

function drawGrid(ctx: CanvasRenderingContext2D, result: ShareResult, x: number, y: number, size: number) {
  const { n, layout } = getGeometry(result.size)
  const cell = size / n
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.12)"
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  ctx.fillStyle = "#ffffff"
  roundRect(ctx, x, y, size, size, 12)
  ctx.fill()
  ctx.restore()

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const fontSize = Math.round(cell * 0.56)
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n)
    const c = i % n
    const given = !!result.givens[i]
    ctx.fillStyle = given ? INK : ACCENT
    ctx.font = `${given ? 700 : 500} ${fontSize}px ${FONT}`
    ctx.fillText(symbol(result.solution[i]), x + c * cell + cell / 2, y + r * cell + cell / 2 + fontSize * 0.04)
  }

  for (let k = 1; k < n; k++) {
    const p = k * cell
    const thickV = k % layout.boxCols === 0
    const thickH = k % layout.boxRows === 0
    line(ctx, x + p, y, x + p, y + size, thickV ? INK : "#c4c4c8", thickV ? 4 : 1.5)
    line(ctx, x, y + p, x + size, y + p, thickH ? INK : "#c4c4c8", thickH ? 4 : 1.5)
  }
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  roundRect(ctx, x, y, size, size, 12)
  ctx.stroke()
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const u = s / 30
  ctx.fillStyle = INK
  roundRect(ctx, x + u, y + u, 28 * u, 28 * u, 6 * u)
  ctx.fill()
  ctx.fillStyle = "#38bdf8"
  roundRect(ctx, x + 11 * u, y + 11 * u, 8 * u, 8 * u, 1.2 * u)
  ctx.fill()
  ctx.lineCap = "round"
  for (const p of [10.33, 19.67]) {
    line(ctx, x + p * u, y + 4 * u, x + p * u, y + 26 * u, "#ffffff", 1.6 * u)
    line(ctx, x + 4 * u, y + p * u, x + 26 * u, y + p * u, "#ffffff", 1.6 * u)
  }
  ctx.lineCap = "butt"
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function xIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url, via: "adalcodes" })
  return `https://x.com/intent/post?${params}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
