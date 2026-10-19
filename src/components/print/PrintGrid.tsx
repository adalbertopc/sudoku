import { getGeometry, symbol, type GridSize } from "@/lib/sudoku/geometry"

interface PrintGridProps {
  size: GridSize
  puzzle: number[]
  solution?: number[]
  label: string
  className?: string
}

const CELL = 100
const FONT = "'Geist Variable', 'Helvetica Neue', Arial, sans-serif"

export function PrintGrid({ size, puzzle, solution, label, className }: PrintGridProps) {
  const { boxRows, boxCols } = getGeometry(size).layout
  const total = size * CELL
  const pad = 5
  const thin: string[] = []
  const thick: string[] = []
  for (let k = 1; k < size; k++) {
    const p = k * CELL
    ;(k % boxCols === 0 ? thick : thin).push(`M${p} 0V${total}`)
    ;(k % boxRows === 0 ? thick : thin).push(`M0 ${p}H${total}`)
  }
  const fontSize = size >= 12 ? 52 : 60
  const values = solution ?? puzzle

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${total + pad * 2} ${total + pad * 2}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <rect x={0} y={0} width={total} height={total} fill="#fff" />
      <path d={thin.join("")} stroke="#6b6b6b" strokeWidth={2} fill="none" />
      <path d={thick.join("")} stroke="#000" strokeWidth={5} fill="none" strokeLinecap="square" />
      <rect x={0} y={0} width={total} height={total} fill="none" stroke="#000" strokeWidth={8} />
      {values.map((v, i) => {
        if (!v) return null
        const given = !!puzzle[i]
        const x = (i % size) * CELL + CELL / 2
        const y = Math.floor(i / size) * CELL + CELL / 2
        return (
          <text
            key={i}
            x={x}
            y={y}
            dy="0.36em"
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={fontSize}
            fontWeight={given ? 600 : 400}
            fill={given || !solution ? "#000" : "#555"}
          >
            {symbol(v)}
          </text>
        )
      })}
    </svg>
  )
}
