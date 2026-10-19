import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DIFFICULTIES, SIZES, type Difficulty, type GridSize } from "@/lib/sudoku/geometry"
import { getT, type Lang } from "@/i18n/ui"

interface Option {
  value: string
  label: string
}

interface OptionSelectProps {
  id: string
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}

export function OptionSelect({ id, label, value, options, onChange }: OptionSelectProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select items={options} value={value} onValueChange={(v) => v !== null && onChange(String(v))}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const SIZE_OPTIONS: Option[] = SIZES.map((s) => ({ value: String(s), label: `${s} × ${s}` }))

export function SizeSelect({
  lang,
  id,
  value,
  onChange,
}: {
  lang: Lang
  id: string
  value: GridSize
  onChange: (v: GridSize) => void
}) {
  return (
    <OptionSelect
      id={id}
      label={getT(lang).size}
      value={String(value)}
      options={SIZE_OPTIONS}
      onChange={(v) => onChange(Number(v) as GridSize)}
    />
  )
}

export function DifficultySelect({
  lang,
  id,
  value,
  onChange,
}: {
  lang: Lang
  id: string
  value: Difficulty
  onChange: (v: Difficulty) => void
}) {
  const t = getT(lang)
  return (
    <OptionSelect
      id={id}
      label={t.difficultyLabel}
      value={value}
      options={DIFFICULTIES.map((d) => ({ value: d, label: t.difficulty[d] }))}
      onChange={(v) => onChange(v as Difficulty)}
    />
  )
}
