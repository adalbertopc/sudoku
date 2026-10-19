import type { APIRoute } from "astro"
import { CONTENT, SITE_NAME } from "@/i18n/content"
import { ROUTES } from "@/i18n/ui"

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href
  const body = `# ${SITE_NAME.en} / ${SITE_NAME.es}

> Free browser-based sudoku generator to play online or print in black and white. Boards 4×4, 6×6, 8×8, 9×9 and 12×12; four difficulty levels (easy, medium, hard, expert) graded by a human-technique logic solver; every puzzle has a unique solution. No sign-up, no server: everything runs locally in the browser.

## English

- [${CONTENT.en.play.h1}](${url(ROUTES.en.play)}): ${CONTENT.en.play.description}
- [${CONTENT.en.print.h1}](${url(ROUTES.en.print)}): ${CONTENT.en.print.description}

## Español

- [${CONTENT.es.play.h1}](${url(ROUTES.es.play)}): ${CONTENT.es.play.description}
- [${CONTENT.es.print.h1}](${url(ROUTES.es.print)}): ${CONTENT.es.print.description}

## How difficulty works

- Easy: naked and hidden singles only, many clues.
- Medium: up to locked candidates (pointing / claiming).
- Hard: requires locked candidates, naked/hidden pairs or naked triples.
- Expert: requires hidden triples, X-Wing, Y-Wing or Swordfish; always solvable without guessing.
`
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
