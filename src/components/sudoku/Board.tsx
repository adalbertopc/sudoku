import { memo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { bit, getGeometry, symbol, type GridSize } from "@/lib/sudoku/geometry"

export interface BoardSettings {
  highlightDuplicates: boolean
  showErrors: boolean
  highlightSame: boolean
  highlightArea: boolean
}

interface BoardProps {
  size: GridSize
  givens: number[]
  values: number[]
  notes: number[]
  solution: number[]
  hinted: number[]
  selected: number | null
  conflicts: Set<number>
  hintIndex: number | null
  settings: BoardSettings
  hidden: boolean
  labels: BoardLabels
  onSelect: (index: number) => void
}

interface BoardLabels {
  label: string
  cell: (r: number, c: number, v: string) => string
}

const THICK = "var(--foreground)"
const THIN = "color-mix(in oklch, var(--foreground) 22%, transparent)"

export function Board(props: BoardProps) {
  const { size, givens, values, notes, solution, selected, conflicts, settings, hidden, onSelect } = props
  const g = getGeometry(size)
  const { boxRows, boxCols } = g.layout
  const selectedValue = selected !== null ? values[selected] : 0
  const hinted = new Set(props.hinted)

  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <div
        role="grid"
        aria-label={props.labels.label}
        className="grid aspect-square w-full overflow-hidden rounded-lg border-[3px] border-foreground bg-card select-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {values.map((value, i) => {
          const r = g.rowOf[i]
          const c = g.colOf[i]
          const isSelected = selected === i
          const inArea =
            settings.highlightArea &&
            selected !== null &&
            !isSelected &&
            (g.rowOf[selected] === r || g.colOf[selected] === c || g.boxOf[selected] === g.boxOf[i])
          const sameValue = settings.highlightSame && !!selectedValue && !isSelected && value === selectedValue
          const sameNote =
            settings.highlightSame && !!selectedValue && !value && (notes[i] & bit(selectedValue)) !== 0
          const isConflict = settings.highlightDuplicates && conflicts.has(i)
          const isError = settings.showErrors && !!value && !givens[i] && value !== solution[i]
          const thickRight = (c + 1) % boxCols === 0
          const thickBottom = (r + 1) % boxRows === 0
          const style: CSSProperties = {
            borderRightWidth: c === size - 1 ? 0 : thickRight ? 2 : 1,
            borderBottomWidth: r === size - 1 ? 0 : thickBottom ? 2 : 1,
            borderRightColor: thickRight ? THICK : THIN,
            borderBottomColor: thickBottom ? THICK : THIN,
          }
          return (
            <Cell
              key={i}
              index={i}
              value={hidden ? 0 : value}
              notes={hidden ? 0 : notes[i]}
              given={!!givens[i]}
              hinted={hinted.has(i)}
              size={size}
              boxRows={boxRows}
              boxCols={boxCols}
              selected={isSelected && !hidden}
              area={inArea && !hidden}
              same={sameValue && !hidden}
              sameNoteValue={sameNote && !hidden ? selectedValue : 0}
              conflict={(isConflict || isError) && !hidden}
              flash={props.hintIndex === i && !hidden}
              style={style}
              cellLabel={props.labels.cell}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}

interface CellProps {
  index: number
  value: number
  notes: number
  given: boolean
  hinted: boolean
  size: number
  boxRows: number
  boxCols: number
  selected: boolean
  area: boolean
  same: boolean
  sameNoteValue: number
  conflict: boolean
  flash: boolean
  style: CSSProperties
  cellLabel: BoardLabels["cell"]
  onSelect: (index: number) => void
}

const Cell = memo(function Cell(p: CellProps) {
  const r = Math.floor(p.index / p.size) + 1
  const c = (p.index % p.size) + 1
  return (
    <div
      role="gridcell"
      aria-selected={p.selected}
      aria-label={p.cellLabel(r, c, symbol(p.value))}
      onPointerDown={() => p.onSelect(p.index)}
      className={cn(
        "relative flex cursor-pointer items-center justify-center border-solid transition-colors duration-75",
        p.area && "bg-muted",
        p.same && "bg-sky-100 dark:bg-sky-950",
        p.selected && "bg-sky-200 dark:bg-sky-800",
        p.conflict && "bg-red-100 dark:bg-red-950",
        p.conflict && p.selected && "bg-red-200 dark:bg-red-900",
        p.flash && "animate-hint",
      )}
      style={p.style}
    >
      {p.value ? (
        <span
          className={cn(
            "leading-none",
            p.given ? "font-semibold text-foreground" : "font-medium text-sky-700 dark:text-sky-300",
            p.hinted && !p.given && "text-violet-700 dark:text-violet-300",
            p.conflict && !p.given && "text-red-600 dark:text-red-400",
            p.conflict && p.given && "text-red-700 dark:text-red-400",
          )}
          style={{ fontSize: `calc(100cqi / ${p.size} * 0.56)` }}
        >
          {symbol(p.value)}
        </span>
      ) : p.notes ? (
        <div
          className="grid h-full w-full p-[6%] text-muted-foreground"
          style={{
            gridTemplateColumns: `repeat(${p.boxCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${p.boxRows}, minmax(0, 1fr))`,
            fontSize: `calc(100cqi / ${p.size} / ${Math.max(p.boxCols, p.boxRows)} * 0.78)`,
          }}
        >
          {Array.from({ length: p.size }, (_, k) => {
            const v = k + 1
            const on = (p.notes & bit(v)) !== 0
            return (
              <span
                key={v}
                className={cn(
                  "flex items-center justify-center leading-none font-medium",
                  on && p.sameNoteValue === v && "rounded-sm bg-sky-600 text-white dark:bg-sky-500",
                )}
              >
                {on ? symbol(v) : ""}
              </span>
            )
          })}
        </div>
      ) : null}
    </div>
  )
})
