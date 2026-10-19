import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react"
import {
  Eraser,
  Lightbulb,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { KEYS, load, save } from "@/lib/storage"
import { generateInWorker, type GenerateJob } from "@/lib/sudoku/client"
import {
  createGame,
  findConflicts,
  formatTime,
  gameReducer,
  isValidGameState,
  remainingCounts,
  type GameAction,
  type GameState,
} from "@/lib/sudoku/game"
import {
  DIFFICULTIES,
  isGridSize,
  symbol,
  valueFromKey,
  type Difficulty,
  type GridSize,
} from "@/lib/sudoku/geometry"
import { Board, type BoardSettings } from "./Board"
import { NumberPad } from "./NumberPad"
import { DifficultySelect, SizeSelect } from "./OptionSelect"
import { getT, type Dictionary, type Lang } from "@/i18n/ui"

interface Settings extends BoardSettings {
  autoRemoveNotes: boolean
  showTimer: boolean
}

interface Preferences {
  size: GridSize
  difficulty: Difficulty
}

type Stats = Record<string, { best: number; played: number }>

const DEFAULT_SETTINGS: Settings = {
  highlightDuplicates: true,
  showErrors: false,
  highlightSame: true,
  highlightArea: true,
  autoRemoveNotes: true,
  showTimer: true,
}

const DEFAULT_PREFERENCES: Preferences = { size: 9, difficulty: "medio" }

type RootAction = GameAction | { type: "load"; state: GameState }

function rootReducer(state: GameState | null, action: RootAction): GameState | null {
  if (action.type === "load") return action.state
  if (!state) return state
  return gameReducer(state, action)
}

function initialGame(): GameState | null {
  const saved = load<unknown>(KEYS.game, null)
  return isValidGameState(saved) ? saved : null
}

function initialPreferences(): Preferences {
  const saved = load<Partial<Preferences>>(KEYS.preferences, {})
  return {
    size: isGridSize(saved.size) ? saved.size : DEFAULT_PREFERENCES.size,
    difficulty: saved.difficulty && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : "medio",
  }
}

function hintMessage(game: GameState, t: Dictionary): string | null {
  const h = game.lastHint
  if (!h) return null
  const v = symbol(h.value)
  if (h.fixed) return t.game.hintFixed(v)
  if (h.technique === "naked-single") return t.game.hintNaked(v)
  if (h.technique === "hidden-single") return t.game.hintHidden(v, h.unit ?? "box")
  return t.game.hintReveal(v)
}

export default function SudokuGame({ lang }: { lang: Lang }) {
  const t = getT(lang)
  const [game, dispatch] = useReducer(rootReducer, null, initialGame)
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...load<Partial<Settings>>(KEYS.settings, {}),
  }))
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences)
  const [draft, setDraft] = useState<Preferences>(prefs)
  const [stats, setStats] = useState<Stats>(() => load<Stats>(KEYS.stats, {}))
  const [selected, setSelected] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [paused, setPaused] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [restartOpen, setRestartOpen] = useState(false)
  const [result, setResult] = useState<{ time: number; best: number; isBest: boolean } | null>(null)
  const jobRef = useRef<GenerateJob | null>(null)
  const completedRef = useRef<string | null>(game?.completed ? game.id : null)

  const startNew = useCallback((size: GridSize, difficulty: Difficulty) => {
    jobRef.current?.cancel()
    setGenerating(true)
    setError(null)
    setPaused(false)
    setSelected(null)
    setResult(null)
    const job = generateInWorker({ size, difficulty, count: 1 })
    jobRef.current = job
    job.promise
      .then(([puzzle]) => {
        dispatch({ type: "load", state: createGame(puzzle) })
        setGenerating(false)
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return
        setGenerating(false)
        setError("gen")
      })
  }, [])

  useEffect(() => {
    if (!game) startNew(prefs.size, prefs.difficulty)
    return () => jobRef.current?.cancel()
  }, [])

  useEffect(() => {
    if (game) save(KEYS.game, game)
  }, [game])

  useEffect(() => save(KEYS.settings, settings), [settings])
  useEffect(() => save(KEYS.preferences, prefs), [prefs])

  const running = !!game && !game.completed && !paused && !generating

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      dispatch({ type: "tick", ms: now - last })
      last = now
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPaused(true)
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  useEffect(() => {
    if (!game?.completed || completedRef.current === game.id) return
    completedRef.current = game.id
    const key = `${game.size}-${game.difficulty}`
    const prev = stats[key]
    const best = prev ? Math.min(prev.best, game.elapsed) : game.elapsed
    const next = { ...stats, [key]: { best, played: (prev?.played ?? 0) + 1 } }
    setStats(next)
    save(KEYS.stats, next)
    setResult({ time: game.elapsed, best, isBest: !prev || game.elapsed < prev.best })
    setSelected(null)
  }, [game, stats])

  useEffect(() => {
    if (game?.lastHint) setSelected(game.lastHint.index)
  }, [game?.lastHint])

  const conflicts = useMemo(() => (game ? findConflicts(game.values, game.size) : new Set<number>()), [game?.values])
  const remaining = useMemo(() => (game ? remainingCounts(game.values, game.size) : []), [game?.values])

  const interactive = !!game && !game.completed && !paused && !generating

  const input = useCallback(
    (value: number, forceNotes = false) => {
      if (!interactive || selected === null) return
      dispatch({
        type: "input",
        index: selected,
        value,
        notesMode: notesMode || forceNotes,
        autoRemoveNotes: settings.autoRemoveNotes,
      })
    },
    [interactive, selected, notesMode, settings.autoRemoveNotes],
  )

  const erase = useCallback(() => {
    if (interactive && selected !== null) dispatch({ type: "erase", index: selected })
  }, [interactive, selected])

  const undo = useCallback(() => {
    if (interactive) dispatch({ type: "undo" })
  }, [interactive])

  const hint = useCallback(() => {
    if (interactive) dispatch({ type: "hint", index: selected, autoRemoveNotes: settings.autoRemoveNotes })
  }, [interactive, selected, settings.autoRemoveNotes])

  const anyDialogOpen = newOpen || restartOpen || !!result

  useEffect(() => {
    if (!game) return
    const size = game.size
    const onKey = (e: KeyboardEvent) => {
      if (anyDialogOpen) return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [role=listbox], [role=dialog]")) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        undo()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === " " || e.key.toLowerCase() === "p") {
        if (game.completed) return
        e.preventDefault()
        setPaused((p) => !p)
        return
      }
      if (!interactive) return
      const arrows: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      if (arrows[e.key]) {
        e.preventDefault()
        const [dr, dc] = arrows[e.key]
        setSelected((cur) => {
          if (cur === null) return 0
          const r = (Math.floor(cur / size) + dr + size) % size
          const c = ((cur % size) + dc + size) % size
          return r * size + c
        })
        return
      }
      if (e.key === "Escape") {
        setSelected(null)
        return
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        erase()
        return
      }
      const digit = /^(?:Digit|Numpad)(\d)$/.exec(e.code)
      if (digit) {
        const v = Number(digit[1])
        e.preventDefault()
        if (v === 0) erase()
        else if (v <= size) input(v, e.shiftKey)
        return
      }
      const key = e.key.toLowerCase()
      if (key === "n") {
        setNotesMode((m) => !m)
        return
      }
      if (key === "h") {
        hint()
        return
      }
      if (size > 9) {
        const v = valueFromKey(e.key, size)
        if (v && v > 9) input(v, e.shiftKey)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [game?.size, game?.completed, anyDialogOpen, interactive, input, erase, undo, hint])

  const openNewGame = () => {
    setDraft(game ? { size: game.size, difficulty: game.difficulty } : prefs)
    setNewOpen(true)
  }

  const confirmNewGame = () => {
    setPrefs(draft)
    setNewOpen(false)
    startNew(draft.size, draft.difficulty)
  }

  const updateSetting = (key: keyof Settings, value: boolean) => setSettings((s) => ({ ...s, [key]: value }))

  const bestForCurrent = game ? stats[`${game.size}-${game.difficulty}`]?.best : undefined
  const message = game ? hintMessage(game, t) : null
  const filled = game ? game.values.filter((v, i) => v && v === game.solution[i]).length : 0
  const total = game ? game.size * game.size : 1
  const givens = game ? game.givens.filter(Boolean).length : 0
  const progress = game ? Math.round(((filled - givens) / Math.max(1, total - givens)) * 100) : 0

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-4 pb-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:pt-6 lg:pb-10">
      <section className="flex min-w-0 flex-col items-center gap-3">
        <div
          className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2"
          style={{ maxWidth: "min(100%, calc(100dvh - 15rem))" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {game && (
              <>
                <Badge variant="secondary">
                  {game.size} × {game.size}
                </Badge>
                <Badge variant="outline">{t.difficulty[game.difficulty]}</Badge>
              </>
            )}
            {game && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t.game.mistakes} {game.mistakes} · {t.game.hints} {game.hints}
              </span>
            )}
          </div>
          {game && settings.showTimer && (
            <div className="flex items-center gap-1.5">
              <span
                className="flex items-center gap-1.5 font-mono text-lg font-medium tabular-nums"
                aria-label={t.game.elapsed}
              >
                <Timer className="size-4 text-muted-foreground" />
                {formatTime(game.elapsed)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={paused ? t.game.resume : t.game.pause}
                disabled={game.completed || generating}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <Play /> : <Pause />}
              </Button>
            </div>
          )}
        </div>

        <div className="relative w-full" style={{ maxWidth: "min(100%, calc(100dvh - 15rem))" }}>
          {game ? (
            <Board
              size={game.size}
              givens={game.givens}
              values={game.values}
              notes={game.notes}
              solution={game.solution}
              hinted={game.hinted}
              selected={interactive ? selected : null}
              conflicts={conflicts}
              hintIndex={game.lastHint?.index ?? null}
              settings={settings}
              hidden={paused || generating}
              labels={t.board}
              onSelect={setSelected}
            />
          ) : (
            <div className="aspect-square w-full rounded-lg border-[3px] border-foreground/20 bg-muted/40" />
          )}
          {(generating || (paused && game && !game.completed)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/70 backdrop-blur-sm">
              {generating ? (
                <>
                  <Loader2 className="size-7 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t.game.generating}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">{t.game.paused}</p>
                  <Button onClick={() => setPaused(false)}>
                    <Play data-icon="inline-start" />
                    {t.game.resume}
                  </Button>
                </>
              )}
            </div>
          )}
          {error && !generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80">
              <p className="text-sm text-destructive">{t.game.genError}</p>
              <Button onClick={() => startNew(prefs.size, prefs.difficulty)}>{t.game.retry}</Button>
            </div>
          )}
        </div>

        <div className="min-h-10 w-full" style={{ maxWidth: "min(100%, calc(100dvh - 15rem))" }}>
          {message ? (
            <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
              <Lightbulb className="mt-0.5 size-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : game?.completed ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
              <Trophy className="size-4" />
              {t.game.solvedIn(formatTime(game.elapsed))}
              <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={openNewGame}>
                {t.game.playAnother}
              </Button>
            </div>
          ) : (
            game && (
              <div className="flex items-center gap-3 px-1 pt-1">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground/70 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
              </div>
            )
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          <ToolButton label={t.game.undo} shortcut="Ctrl+Z" disabled={!interactive || !game?.history.length} onClick={undo}>
            <Undo2 />
          </ToolButton>
          <ToolButton label={t.game.erase} shortcut={lang === "es" ? "Supr" : "Del"} disabled={!interactive || selected === null} onClick={erase}>
            <Eraser />
          </ToolButton>
          <ToolButton
            label={t.game.notes}
            shortcut="N"
            active={notesMode}
            disabled={!interactive}
            onClick={() => setNotesMode((m) => !m)}
          >
            <Pencil />
          </ToolButton>
          <ToolButton label={t.game.hint} shortcut="H" disabled={!interactive} onClick={hint}>
            <Lightbulb />
          </ToolButton>
        </div>

        {game && (
          <NumberPad
            size={game.size}
            remaining={remaining}
            notesMode={notesMode}
            disabled={!interactive || selected === null}
            onInput={(v) => input(v)}
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!interactive} onClick={() => dispatch({ type: "fill-notes" })}>
            <Sparkles data-icon="inline-start" />
            {t.game.autoNotes}
          </Button>
          <Button variant="outline" disabled={!game || generating} onClick={() => setRestartOpen(true)}>
            <RotateCcw data-icon="inline-start" />
            {t.game.restart}
          </Button>
        </div>

        <Button size="lg" className="h-10" onClick={openNewGame} disabled={generating}>
          <Plus data-icon="inline-start" />
          {t.game.newGame}
        </Button>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{t.game.helps}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SettingRow
              label={t.game.settings.highlightDuplicates[0]}
              description={t.game.settings.highlightDuplicates[1]}
              checked={settings.highlightDuplicates}
              onChange={(v) => updateSetting("highlightDuplicates", v)}
            />
            <SettingRow
              label={t.game.settings.showErrors[0]}
              description={t.game.settings.showErrors[1]}
              checked={settings.showErrors}
              onChange={(v) => updateSetting("showErrors", v)}
            />
            <SettingRow
              label={t.game.settings.highlightSame[0]}
              description={t.game.settings.highlightSame[1]}
              checked={settings.highlightSame}
              onChange={(v) => updateSetting("highlightSame", v)}
            />
            <SettingRow
              label={t.game.settings.highlightArea[0]}
              description={t.game.settings.highlightArea[1]}
              checked={settings.highlightArea}
              onChange={(v) => updateSetting("highlightArea", v)}
            />
            <SettingRow
              label={t.game.settings.autoRemoveNotes[0]}
              description={t.game.settings.autoRemoveNotes[1]}
              checked={settings.autoRemoveNotes}
              onChange={(v) => updateSetting("autoRemoveNotes", v)}
            />
            <SettingRow
              label={t.game.settings.showTimer[0]}
              description={t.game.settings.showTimer[1]}
              checked={settings.showTimer}
              onChange={(v) => updateSetting("showTimer", v)}
            />
          </CardContent>
        </Card>

        {bestForCurrent !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="size-3.5" />
            {game && t.game.best(`${game.size}×${game.size} ${t.difficulty[game.difficulty].toLowerCase()}`)}{" "}
            <span className="font-medium text-foreground tabular-nums">{formatTime(bestForCurrent)}</span>
          </p>
        )}

        <p className="hidden text-xs leading-relaxed text-muted-foreground lg:block">
          {t.game.keyboard(!!game && game.size > 9)}
        </p>
      </aside>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.game.newGame}</DialogTitle>
            <DialogDescription>{t.game.newGameDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <SizeSelect lang={lang} id="new-size" value={draft.size} onChange={(size) => setDraft((d) => ({ ...d, size }))} />
            <DifficultySelect
              lang={lang}
              id="new-difficulty"
              value={draft.difficulty}
              onChange={(difficulty) => setDraft((d) => ({ ...d, difficulty }))}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {draft.size <= 6 ? t.smallBoardNote : t.difficultyDesc[draft.difficulty]}
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.cancel}</DialogClose>
            <Button onClick={confirmNewGame}>{t.game.start}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.game.restartTitle}</DialogTitle>
            <DialogDescription>{t.game.restartDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.cancel}</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch({ type: "restart" })
                completedRef.current = null
                setRestartOpen(false)
                setPaused(false)
                setSelected(null)
              }}
            >
              {t.game.restart}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              {t.game.solvedTitle}
            </DialogTitle>
            <DialogDescription>
              {game && `${game.size} × ${game.size} · ${t.difficulty[game.difficulty]}`}
            </DialogDescription>
          </DialogHeader>
          {result && game && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label={t.game.time} value={formatTime(result.time)} />
              <Stat label={t.game.mistakes} value={String(game.mistakes)} />
              <Stat label={t.game.hints} value={String(game.hints)} />
            </div>
          )}
          {result && (
            <p className="text-center text-sm text-muted-foreground">
              {result.isBest ? t.game.newRecord : t.game.yourBest(formatTime(result.best))}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.game.viewBoard}</DialogClose>
            <Button
              onClick={() => {
                setResult(null)
                openNewGame()
              }}
            >
              {t.game.newGame}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      className={cn("h-auto flex-col gap-1 px-1 py-2.5 [&_svg:not([class*='size-'])]:size-5")}
      disabled={disabled}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
    >
      {children}
      <span className="text-[11px] leading-none font-medium">{label}</span>
    </Button>
  )
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-2 py-3">
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
