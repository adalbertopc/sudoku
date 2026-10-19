import { useState } from "react"
import { Check, Copy, ImageDown, Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadBlob, renderShareImage, xIntentUrl, type ShareResult } from "@/lib/share"
import type { Dictionary } from "@/i18n/ui"

interface ShareActionsProps {
  result: ShareResult
  t: Dictionary
  compact?: boolean
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function ShareActions({ result, t, compact }: ShareActionsProps) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = t.share.text(result.size, result.difficultyLabel, result.time, result.mistakes, result.hints)

  const image = () =>
    renderShareImage(result, {
      title: t.share.imageTitle,
      time: t.game.time,
      mistakes: t.game.mistakes,
      hints: t.game.hints,
      playAt: t.share.playAt,
    })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${result.url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const share = async () => {
    setBusy(true)
    try {
      if (navigator.share) {
        const blob = await image().catch(() => null)
        const file = blob ? new File([blob], t.share.filename, { type: "image/png" }) : null
        const data: ShareData = { title: t.share.imageTitle, text, url: result.url }
        if (file && navigator.canShare?.({ files: [file] })) data.files = [file]
        await navigator.share(data)
      } else {
        await copy()
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") await copy()
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    setBusy(true)
    try {
      downloadBlob(await image(), t.share.filename)
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <Button variant="link" size="sm" className="h-auto p-0" onClick={share} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Share2 data-icon="inline-start" />}
        {copied ? t.share.copied : t.share.shortShare}
      </Button>
    )
  }

  return (
    <div className="grid gap-2">
      <Button size="lg" className="h-10" onClick={share} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Share2 data-icon="inline-start" />}
        {t.share.share}
      </Button>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={xIntentUrl(text, result.url)} target="_blank" rel="noopener" aria-label={t.share.postX} title={t.share.postX} />}
        >
          <XIcon />
          X
        </Button>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? t.share.copied : t.share.copy}
        </Button>
        <Button variant="outline" onClick={download} disabled={busy}>
          <ImageDown data-icon="inline-start" />
          {t.share.image}
        </Button>
      </div>
    </div>
  )
}
