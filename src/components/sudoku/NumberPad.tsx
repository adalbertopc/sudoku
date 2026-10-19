import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { symbol } from "@/lib/sudoku/geometry"

interface NumberPadProps {
  size: number
  remaining: number[]
  notesMode: boolean
  disabled: boolean
  onInput: (value: number) => void
}

const DESKTOP_COLUMNS: Record<number, number> = { 4: 2, 6: 3, 8: 4, 9: 3, 12: 4 }

export function NumberPad({ size, remaining, notesMode, disabled, onInput }: NumberPadProps) {
  return (
    <div
      className="grid grid-cols-[repeat(var(--cols-mobile),minmax(0,1fr))] gap-1.5 lg:grid-cols-[repeat(var(--cols-desktop),minmax(0,1fr))] lg:gap-2"
      style={
        {
          "--cols-mobile": size <= 9 ? size : 6,
          "--cols-desktop": DESKTOP_COLUMNS[size] ?? 3,
        } as CSSProperties
      }
    >
      {Array.from({ length: size }, (_, k) => {
        const v = k + 1
        const done = remaining[v] <= 0
        return (
          <button
            key={v}
            type="button"
            disabled={disabled || (done && !notesMode)}
            onClick={() => onInput(v)}
            className={cn(
              "group relative flex h-14 flex-col items-center justify-center rounded-lg border bg-card text-xl font-semibold shadow-xs transition-all outline-none select-none sm:h-16 sm:text-2xl lg:aspect-[5/4] lg:h-auto",
              "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
              "disabled:pointer-events-none disabled:opacity-35",
              notesMode && "border-dashed text-muted-foreground",
            )}
          >
            <span className="leading-none">{symbol(v)}</span>
            <span className="mt-0.5 text-[10px] font-normal text-muted-foreground tabular-nums sm:text-xs">
              {done ? "✓" : remaining[v]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
