import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { FileText, Loader2, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { KEYS, load, save } from "@/lib/storage"
import { generateInWorker, type GenerateJob } from "@/lib/sudoku/client"
import type { Puzzle } from "@/lib/sudoku/generator"
import { isGridSize, type Difficulty, type GridSize } from "@/lib/sudoku/geometry"
import { getT, type Lang } from "@/i18n/ui"
import { DifficultySelect, SizeSelect } from "@/components/sudoku/OptionSelect"
import { PrintGrid } from "./PrintGrid"

type Paper = "letter" | "a4"

interface PrintConfig {
  size: GridSize
  difficulty: Difficulty
  count: number
  perPage: number
  paper: Paper
  solutions: boolean
  title: string
}

interface SavedPrint {
  config: PrintConfig
  puzzles: Puzzle[]
}

const DEFAULT_CONFIG: PrintConfig = {
  size: 9,
  difficulty: "medio",
  count: 4,
  perPage: 2,
  paper: "letter",
  solutions: true,
  title: "Sudokus",
}

const MAX_COUNT = 36

const PAPER: Record<Paper, { width: string; height: string; px: number; css: string }> = {
  letter: { width: "8.5in", height: "11in", px: 816, css: "letter" },
  a4: { width: "210mm", height: "297mm", px: 794, css: "A4" },
}

const ARRANGEMENT: Record<number, [number, number]> = {
  1: [1, 1],
  2: [1, 2],
  4: [2, 2],
  6: [2, 3],
  9: [3, 3],
}

function perPageOptions(size: GridSize): number[] {
  if (size <= 6) return [1, 2, 4, 6, 9]
  if (size === 12) return [1, 2, 4]
  return [1, 2, 4, 6]
}

function solutionsPerPage(size: GridSize): number {
  return size === 12 ? 6 : 9
}

function chunk<T>(items: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n))
  return out
}

function initialState(): SavedPrint {
  const saved = load<Partial<SavedPrint>>(KEYS.print, {})
  const config: PrintConfig = { ...DEFAULT_CONFIG, ...saved.config }
  if (!isGridSize(config.size)) config.size = DEFAULT_CONFIG.size
  if (!perPageOptions(config.size).includes(config.perPage)) config.perPage = DEFAULT_CONFIG.perPage
  const puzzles = Array.isArray(saved.puzzles) ? saved.puzzles : []
  return { config, puzzles }
}

export default function PrintStudio({ lang }: { lang: Lang }) {
  const t = getT(lang)
  const [initial] = useState(initialState)
  const [config, setConfig] = useState<PrintConfig>(initial.config)
  const [puzzles, setPuzzles] = useState<Puzzle[]>(initial.puzzles)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const previewRef = useRef<HTMLDivElement>(null)
  const jobRef = useRef<GenerateJob | null>(null)

  const update = <K extends keyof PrintConfig>(key: K, value: PrintConfig[K]) =>
    setConfig((c) => {
      const next = { ...c, [key]: value }
      if (key === "size" && !perPageOptions(next.size).includes(next.perPage)) {
        const options = perPageOptions(next.size)
        next.perPage = options.reduce((best, o) => (o <= c.perPage ? o : best), options[0])
      }
      return next
    })

  useEffect(() => save(KEYS.print, { config, puzzles }), [config, puzzles])

  const generate = () => {
    jobRef.current?.cancel()
    const { size, difficulty, count } = config
    setProgress({ done: 0, total: count })
    const job = generateInWorker({ size, difficulty, count }, (done, total) => setProgress({ done, total }))
    jobRef.current = job
    job.promise
      .then((result) => {
        setPuzzles(result)
        setProgress(null)
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setProgress(null)
      })
  }

  useEffect(() => {
    if (!initial.puzzles.length) generate()
    return () => jobRef.current?.cancel()
  }, [])

  const paper = PAPER[config.paper]

  useLayoutEffect(() => {
    const el = previewRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setZoom(Math.min(1, (entry.contentRect.width - 2) / paper.px))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [paper.px])

  const stale =
    puzzles.length > 0 &&
    (puzzles.length !== config.count || puzzles[0].size !== config.size || puzzles[0].difficulty !== config.difficulty)

  const printable = puzzles.length ? puzzles[0] : null
  const printSize = printable?.size ?? config.size
  const printDifficulty = printable?.difficulty ?? config.difficulty
  const perPage = perPageOptions(printSize).includes(config.perPage) ? config.perPage : perPageOptions(printSize)[0]

  const pages = useMemo(() => chunk(puzzles, perPage), [puzzles, perPage])
  const solutionPages = useMemo(
    () => (config.solutions ? chunk(puzzles, solutionsPerPage(printSize)) : []),
    [puzzles, config.solutions, printSize],
  )
  const totalPages = pages.length + solutionPages.length
  const subtitle = `${printSize} × ${printSize} · ${t.difficulty[printDifficulty]}`

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pt-4 pb-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10 lg:pt-6 lg:pb-10 print:block print:max-w-none print:p-0">
      <style>{`@page { size: ${paper.css} portrait; margin: 0; }`}</style>

      <aside className="flex flex-col gap-4 print:hidden lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>{t.print.title}</CardTitle>
            <CardDescription>{t.print.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-2 gap-3">
              <SizeSelect lang={lang} id="print-size" value={config.size} onChange={(v) => update("size", v)} />
              <DifficultySelect lang={lang} id="print-difficulty" value={config.difficulty} onChange={(v) => update("difficulty", v)} />
            </div>

            <div className="grid gap-2.5">
              <div className="flex items-center justify-between">
                <Label>{t.print.count}</Label>
                <span className="text-sm font-medium tabular-nums">{config.count}</span>
              </div>
              <Slider
                min={1}
                max={MAX_COUNT}
                step={1}
                value={[config.count]}
                onValueChange={(v) => update("count", Array.isArray(v) ? v[0] : v)}
                aria-label={t.print.countLabel}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t.print.perPage}</Label>
              <ToggleGroup
                variant="outline"
                spacing={0}
                value={[String(config.perPage)]}
                onValueChange={(v) => v[0] && update("perPage", Number(v[0]))}
                className="w-full"
              >
                {perPageOptions(config.size).map((o) => (
                  <ToggleGroupItem key={o} value={String(o)} className="flex-1">
                    {o}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label>{t.print.paper}</Label>
              <ToggleGroup
                variant="outline"
                spacing={0}
                value={[config.paper]}
                onValueChange={(v) => v[0] && update("paper", v[0] as Paper)}
                className="w-full"
              >
                {(Object.keys(PAPER) as Paper[]).map((p) => (
                  <ToggleGroupItem key={p} value={p} className="flex-1">
                    {t.print.paperNames[p]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="print-title">{t.print.sheetTitle}</Label>
              <Input
                id="print-title"
                value={config.title}
                maxLength={60}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="grid gap-0.5">
                <span className="text-sm font-medium">{t.print.includeSolutions}</span>
                <span className="text-xs text-muted-foreground">{t.print.solutionsDesc}</span>
              </span>
              <Switch checked={config.solutions} onCheckedChange={(v) => update("solutions", v)} />
            </label>

            <div className="grid gap-2">
              <Button variant={stale ? "default" : "outline"} onClick={generate} disabled={!!progress}>
                {progress ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
                {progress ? t.print.generating(progress.done, progress.total) : puzzles.length ? t.print.regenerate : t.print.generate}
              </Button>
              <Button
                size="lg"
                className="h-10"
                variant={stale ? "outline" : "default"}
                onClick={() => window.print()}
                disabled={!puzzles.length || !!progress}
              >
                <Printer data-icon="inline-start" />
                {t.print.print} {totalPages > 0 && `(${t.print.sheets(totalPages)})`}
              </Button>
              {stale && !progress && (
                <p className="text-xs text-muted-foreground">
                  {t.print.stale}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <FileText className="mt-0.5 size-3.5 shrink-0" />
          {t.print.tip}
        </p>
      </aside>

      <div ref={previewRef} className="min-w-0 print:w-auto">
        {progress && !puzzles.length ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-sm text-muted-foreground"
            style={{ aspectRatio: config.paper === "a4" ? "210 / 297" : "8.5 / 11", maxWidth: paper.px }}
          >
            <Loader2 className="size-6 animate-spin" />
            {t.print.generating(progress.done, progress.total)}
          </div>
        ) : (
          <div className="print-sheets flex flex-col items-center gap-6" style={{ zoom }}>
            {pages.map((page, p) => (
              <Sheet
                key={`p${p}`}
                paper={config.paper}
                title={config.title}
                subtitle={subtitle}
                page={p + 1}
                totalPages={totalPages}
                perPage={perPage}
              >
                {page.map((puzzle, k) => {
                  const number = p * perPage + k + 1
                  return (
                    <PuzzleFigure key={number} captionHeight="0.3in">
                      <figcaption className="flex h-[0.3in] items-start justify-between gap-2 text-[10pt]">
                        <span className="font-semibold">{t.print.number(number)}</span>
                        <span className="text-[8.5pt] text-[#444]">{t.print.timeField}</span>
                      </figcaption>
                      <PrintGrid size={puzzle.size} puzzle={puzzle.puzzle} label={t.print.puzzle} className="aspect-square w-full" />
                    </PuzzleFigure>
                  )
                })}
              </Sheet>
            ))}
            {solutionPages.map((page, p) => (
              <Sheet
                key={`s${p}`}
                paper={config.paper}
                title={`${t.print.solutions} · ${config.title}`}
                subtitle={subtitle}
                page={pages.length + p + 1}
                totalPages={totalPages}
                perPage={solutionsPerPage(printSize)}
                compact
              >
                {page.map((puzzle, k) => {
                  const number = p * solutionsPerPage(printSize) + k + 1
                  return (
                    <PuzzleFigure key={number} captionHeight="0.24in">
                      <figcaption className="h-[0.24in] text-[9pt] font-semibold">{t.print.number(number)}</figcaption>
                      <PrintGrid
                        size={puzzle.size}
                        puzzle={puzzle.puzzle}
                        solution={puzzle.solution}
                        label={t.print.solution}
                        className="aspect-square w-full"
                      />
                    </PuzzleFigure>
                  )
                })}
              </Sheet>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PuzzleFigure({ captionHeight, children }: { captionHeight: string; children: ReactNode }) {
  return (
    <figure className="flex min-h-0 min-w-0 flex-col justify-center" style={{ containerType: "size" }}>
      <div className="mx-auto flex flex-col" style={{ width: `min(100cqw, calc(100cqh - ${captionHeight}))` }}>
        {children}
      </div>
    </figure>
  )
}

function Sheet({
  paper,
  title,
  subtitle,
  page,
  totalPages,
  perPage,
  compact,
  children,
}: {
  paper: Paper
  title: string
  subtitle: string
  page: number
  totalPages: number
  perPage: number
  compact?: boolean
  children: ReactNode
}) {
  const [cols, rows] = ARRANGEMENT[perPage] ?? [2, Math.ceil(perPage / 2)]
  const dims = PAPER[paper]
  return (
    <section
      className="sheet flex shrink-0 flex-col overflow-hidden bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
      style={{ width: dims.width, height: dims.height, padding: "0.55in 0.6in 0.5in" }}
    >
      <header className="mb-[0.25in] flex items-end justify-between border-b-[1.5pt] border-black pb-[0.08in]">
        <div className="min-w-0">
          <h2 className="truncate text-[15pt] leading-tight font-bold tracking-tight">{title || "Sudoku"}</h2>
          <p className="text-[9pt] text-[#444]">{subtitle}</p>
        </div>
        <span className="shrink-0 text-[9pt] text-[#444] tabular-nums">
          {page} / {totalPages}
        </span>
      </header>
      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          columnGap: compact ? "0.3in" : cols === 1 ? 0 : "0.45in",
          rowGap: compact ? "0.22in" : rows === 1 ? 0 : "0.4in",
        }}
      >
        {children}
      </div>
    </section>
  )
}
