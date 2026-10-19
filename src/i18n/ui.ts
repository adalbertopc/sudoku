import type { Difficulty } from "@/lib/sudoku/geometry"

export const LANGS = ["es", "en"] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = "es"

export type PageKey = "play" | "print"

export const ROUTES: Record<Lang, Record<PageKey, string>> = {
  es: { play: "/", print: "/imprimir/" },
  en: { play: "/en/", print: "/en/print/" },
}

export const LOCALES: Record<Lang, string> = { es: "es_ES", en: "en_US" }

type UnitWord = "row" | "col" | "box"

const es = {
  langName: "Español",
  nav: { play: "Jugar", print: "Imprimir", theme: "Cambiar tema", switchTo: "English", switchLabel: "Cambiar idioma" },
  difficulty: { facil: "Fácil", medio: "Medio", dificil: "Difícil", experto: "Experto" } as Record<Difficulty, string>,
  difficultyDesc: {
    facil: "Muchas pistas iniciales. Se resuelve encontrando celdas con un único candidato.",
    medio: "Menos pistas. Puede requerir candidatos bloqueados en filas o bloques.",
    dificil: "Requiere técnicas intermedias: candidatos bloqueados, pares y tríos desnudos.",
    experto: "Requiere X-Wing, Y-Wing, Swordfish o tríos ocultos. Siempre resoluble con lógica.",
  } as Record<Difficulty, string>,
  smallBoardNote: "En tableros pequeños la dificultad se ajusta principalmente con la cantidad de pistas iniciales.",
  size: "Tamaño",
  difficultyLabel: "Dificultad",
  cancel: "Cancelar",
  close: "Cerrar",
  board: {
    label: "Tablero de sudoku",
    cell: (r: number, c: number, v: string) => `Fila ${r}, columna ${c}, ${v || "vacía"}`,
  },
  game: {
    mistakes: "Errores",
    hints: "Pistas",
    elapsed: "Tiempo transcurrido",
    pause: "Pausar",
    resume: "Continuar",
    generating: "Generando un sudoku con solución única…",
    paused: "Pausado",
    genError: "No se pudo generar el sudoku. Intenta de nuevo.",
    retry: "Reintentar",
    solvedIn: (t: string) => `Resuelto en ${t}.`,
    playAnother: "Jugar otro",
    undo: "Deshacer",
    erase: "Borrar",
    notes: "Notas",
    hint: "Pista",
    autoNotes: "Notas automáticas",
    restart: "Reiniciar",
    newGame: "Nuevo juego",
    helps: "Ayudas",
    settings: {
      highlightDuplicates: ["Señalar repetidos", "Marca números duplicados en fila, columna o bloque."],
      showErrors: ["Mostrar errores", "Compara con la solución y marca lo incorrecto."],
      highlightSame: ["Resaltar iguales", ""],
      highlightArea: ["Resaltar fila, columna y bloque", ""],
      autoRemoveNotes: ["Quitar notas al colocar", ""],
      showTimer: ["Mostrar cronómetro", ""],
    },
    best: (label: string) => `Mejor tiempo en ${label}:`,
    keyboard: (big: boolean) =>
      `Teclado: flechas para moverte, números para escribir${big ? " (A–C para 10–12)" : ""}, Shift + número para notas, N alterna notas, H da una pista, Espacio pausa.`,
    newGameDesc: "El progreso del juego actual se reemplazará.",
    start: "Comenzar",
    restartTitle: "¿Reiniciar este sudoku?",
    restartDesc: "Se borrarán tus números, notas y el tiempo. El tablero inicial se conserva.",
    solvedTitle: "¡Sudoku resuelto!",
    time: "Tiempo",
    newRecord: "¡Nuevo récord personal!",
    yourBest: (t: string) => `Tu mejor tiempo: ${t}`,
    viewBoard: "Ver tablero",
    hintFixed: (v: string) => `Esta celda tenía un error. El valor correcto es ${v}.`,
    hintNaked: (v: string) => `El ${v} es el único candidato posible en esta celda.`,
    hintHidden: (v: string, unit: UnitWord) =>
      `En ${unit === "row" ? "esta fila" : unit === "col" ? "esta columna" : "este bloque"}, el ${v} solo puede ir en esta celda.`,
    hintReveal: (v: string) => `No hay un paso simple disponible; revelé un ${v} en esta celda.`,
  },
  share: {
    share: "Compartir logro",
    shortShare: "Compartir",
    postX: "Publicar en X",
    copy: "Copiar texto",
    copied: "¡Copiado!",
    image: "Imagen",
    imageTitle: "¡Sudoku resuelto!",
    playAt: "Juega gratis en",
    text: (size: number, difficulty: string, time: string, mistakes: number, hints: number) =>
      [
        `🧩 Resolví un sudoku ${size}×${size} ${difficulty} en ${time}`,
        `${mistakes === 0 ? "✅ Sin errores" : `❌ ${mistakes} ${mistakes === 1 ? "error" : "errores"}`} · ${hints === 0 ? "🧠 Sin pistas" : `💡 ${hints} ${hints === 1 ? "pista" : "pistas"}`}`,
        "¿Puedes superarlo?",
      ].join("\n"),
    filename: "sudoku-resuelto.png",
  },
  print: {
    title: "Imprimir sudokus",
    description: "Genera hojas en blanco y negro listas para imprimir, con soluciones al final.",
    count: "Cantidad",
    countLabel: "Cantidad de sudokus",
    perPage: "Sudokus por hoja",
    paper: "Papel",
    paperNames: { letter: "Carta", a4: "A4" },
    sheetTitle: "Título de la hoja",
    defaultTitle: "Sudokus",
    includeSolutions: "Incluir soluciones",
    solutionsDesc: "Se imprimen en hojas aparte, al final.",
    generating: (d: number, t: number) => `Generando ${d}/${t}…`,
    regenerate: "Generar de nuevo",
    generate: "Generar",
    print: "Imprimir",
    sheets: (n: number) => `${n} ${n === 1 ? "hoja" : "hojas"}`,
    stale: "Cambiaste tamaño, dificultad o cantidad. Genera de nuevo para aplicarlo.",
    tip: "En el diálogo de impresión usa márgenes “Ninguno” y desactiva encabezados y pies de página para el mejor resultado.",
    number: (n: number) => `N.º ${n}`,
    timeField: "Tiempo: __________",
    solutions: "Soluciones",
    solution: "Solución",
    puzzle: "Sudoku",
  },
}

export type Dictionary = typeof es

const en: Dictionary = {
  langName: "English",
  nav: { play: "Play", print: "Print", theme: "Toggle theme", switchTo: "Español", switchLabel: "Change language" },
  difficulty: { facil: "Easy", medio: "Medium", dificil: "Hard", experto: "Expert" },
  difficultyDesc: {
    facil: "Plenty of starting clues. Solved by finding cells with a single candidate.",
    medio: "Fewer clues. May require locked candidates in rows or boxes.",
    dificil: "Requires intermediate techniques: locked candidates, naked pairs and triples.",
    experto: "Requires X-Wing, Y-Wing, Swordfish or hidden triples. Always solvable with logic.",
  },
  smallBoardNote: "On small boards, difficulty is mostly tuned by the number of starting clues.",
  size: "Size",
  difficultyLabel: "Difficulty",
  cancel: "Cancel",
  close: "Close",
  board: {
    label: "Sudoku board",
    cell: (r, c, v) => `Row ${r}, column ${c}, ${v || "empty"}`,
  },
  game: {
    mistakes: "Mistakes",
    hints: "Hints",
    elapsed: "Elapsed time",
    pause: "Pause",
    resume: "Resume",
    generating: "Generating a sudoku with a unique solution…",
    paused: "Paused",
    genError: "Couldn't generate the sudoku. Please try again.",
    retry: "Retry",
    solvedIn: (t) => `Solved in ${t}.`,
    playAnother: "Play another",
    undo: "Undo",
    erase: "Erase",
    notes: "Notes",
    hint: "Hint",
    autoNotes: "Auto notes",
    restart: "Restart",
    newGame: "New game",
    helps: "Assists",
    settings: {
      highlightDuplicates: ["Highlight duplicates", "Marks repeated numbers in a row, column or box."],
      showErrors: ["Show mistakes", "Checks against the solution and marks wrong entries."],
      highlightSame: ["Highlight matching numbers", ""],
      highlightArea: ["Highlight row, column and box", ""],
      autoRemoveNotes: ["Remove notes when placing", ""],
      showTimer: ["Show timer", ""],
    },
    best: (label) => `Best time on ${label}:`,
    keyboard: (big) =>
      `Keyboard: arrows to move, numbers to fill${big ? " (A–C for 10–12)" : ""}, Shift + number for notes, N toggles notes, H gives a hint, Space pauses.`,
    newGameDesc: "Your current game progress will be replaced.",
    start: "Start",
    restartTitle: "Restart this sudoku?",
    restartDesc: "Your numbers, notes and time will be cleared. The starting board is kept.",
    solvedTitle: "Sudoku solved!",
    time: "Time",
    newRecord: "New personal best!",
    yourBest: (t) => `Your best time: ${t}`,
    viewBoard: "View board",
    hintFixed: (v) => `This cell had a mistake. The correct value is ${v}.`,
    hintNaked: (v) => `${v} is the only possible candidate for this cell.`,
    hintHidden: (v, unit) => `In this ${unit === "row" ? "row" : unit === "col" ? "column" : "box"}, ${v} can only go in this cell.`,
    hintReveal: (v) => `No simple step available; revealed a ${v} in this cell.`,
  },
  share: {
    share: "Share result",
    shortShare: "Share",
    postX: "Post on X",
    copy: "Copy text",
    copied: "Copied!",
    image: "Image",
    imageTitle: "Sudoku solved!",
    playAt: "Play free at",
    text: (size, difficulty, time, mistakes, hints) =>
      [
        `🧩 I solved a ${size}×${size} ${difficulty} sudoku in ${time}`,
        `${mistakes === 0 ? "✅ No mistakes" : `❌ ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`} · ${hints === 0 ? "🧠 No hints" : `💡 ${hints} ${hints === 1 ? "hint" : "hints"}`}`,
        "Can you beat it?",
      ].join("\n"),
    filename: "sudoku-solved.png",
  },
  print: {
    title: "Print sudokus",
    description: "Create black-and-white sheets ready to print, with solutions at the end.",
    count: "Quantity",
    countLabel: "Number of sudokus",
    perPage: "Sudokus per sheet",
    paper: "Paper",
    paperNames: { letter: "Letter", a4: "A4" },
    sheetTitle: "Sheet title",
    defaultTitle: "Sudokus",
    includeSolutions: "Include solutions",
    solutionsDesc: "Printed on separate sheets at the end.",
    generating: (d, t) => `Generating ${d}/${t}…`,
    regenerate: "Generate again",
    generate: "Generate",
    print: "Print",
    sheets: (n) => `${n} ${n === 1 ? "sheet" : "sheets"}`,
    stale: "You changed size, difficulty or quantity. Generate again to apply it.",
    tip: "In the print dialog, set margins to “None” and turn off headers and footers for the best result.",
    number: (n) => `No. ${n}`,
    timeField: "Time: __________",
    solutions: "Solutions",
    solution: "Solution",
    puzzle: "Sudoku",
  },
}

export const DICTIONARIES: Record<Lang, Dictionary> = { es, en }

export function getT(lang: Lang): Dictionary {
  return DICTIONARIES[lang] ?? es
}

export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang)
}
