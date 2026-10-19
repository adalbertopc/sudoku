import type { Lang, PageKey } from "./ui"

export interface Section {
  title: string
  paragraphs?: string[]
  items?: { term: string; text: string }[]
  list?: string[]
}

export interface PageContent {
  title: string
  description: string
  h1: string
  lead: string
  sections: Section[]
  faqTitle: string
  faq: { q: string; a: string }[]
  crossLink: { text: string; label: string }
}

export const SITE_NAME: Record<Lang, string> = { es: "Sudoku Gratis", en: "Free Sudoku" }

export const CONTENT: Record<Lang, Record<PageKey, PageContent>> = {
  es: {
    play: {
      title: "Sudoku online gratis: fácil, medio, difícil y experto",
      description:
        "Juega sudoku online gratis sin registro. Tableros de 4×4 a 12×12, cuatro niveles, notas, pistas explicadas, cronómetro y progreso guardado automáticamente.",
      h1: "Sudoku online gratis",
      lead: "Elige tamaño y dificultad y empieza a jugar al instante. Cada sudoku se genera en tu navegador y tiene una única solución.",
      sections: [
        {
          title: "Cómo jugar sudoku",
          paragraphs: [
            "El objetivo es llenar el tablero de modo que cada fila, cada columna y cada bloque contengan todos los números exactamente una vez. En el clásico 9×9 se usan los números del 1 al 9 y el tablero se divide en nueve bloques de 3×3.",
            "Selecciona una celda y escribe un número con el teclado numérico en pantalla o con tu teclado. Activa el modo notas para anotar candidatos pequeños mientras razonas. Si te atoras, la pista te muestra el siguiente paso lógico y te explica por qué.",
          ],
        },
        {
          title: "Niveles de dificultad",
          items: [
            { term: "Fácil", text: "Muchas pistas iniciales. Basta con encontrar celdas donde solo cabe un número." },
            { term: "Medio", text: "Menos pistas. A veces necesitarás candidatos bloqueados dentro de un bloque." },
            { term: "Difícil", text: "Requiere pares y tríos desnudos u ocultos, además de candidatos bloqueados." },
            {
              term: "Experto",
              text: "Exige técnicas avanzadas como X-Wing, Y-Wing o Swordfish, pero siempre se resuelve con lógica, sin adivinar.",
            },
          ],
        },
        {
          title: "Tamaños de tablero",
          paragraphs: [
            "Además del sudoku clásico de 9×9 puedes jugar mini sudokus de 4×4 y 6×6, ideales para niños y principiantes, un 8×8 con bloques de 2×4 y un sudoku gigante de 12×12 que usa las letras A, B y C para los valores 10, 11 y 12.",
          ],
        },
        {
          title: "Funciones para jugar mejor",
          list: [
            "Señalar números repetidos en fila, columna o bloque.",
            "Mostrar errores comparando con la solución.",
            "Notas manuales y notas automáticas con todos los candidatos.",
            "Pistas que explican la técnica: único candidato o único lugar posible.",
            "Deshacer ilimitado, cronómetro con pausa y récords personales.",
            "Tu partida se guarda en el navegador; puedes cerrar la pestaña y continuar después.",
            "Modo oscuro y diseño adaptado a móvil, tableta y computadora.",
          ],
        },
      ],
      faqTitle: "Preguntas frecuentes",
      faq: [
        {
          q: "¿Es gratis? ¿Necesito registrarme?",
          a: "Sí, es completamente gratis y no necesitas cuenta. Todo funciona en tu navegador y no se envía ningún dato a un servidor.",
        },
        {
          q: "¿Cada sudoku tiene una sola solución?",
          a: "Sí. Después de generar cada tablero, un solucionador comprueba que exista exactamente una solución antes de mostrártelo.",
        },
        {
          q: "¿Cómo se decide la dificultad?",
          a: "Un solucionador lógico resuelve el sudoku con técnicas humanas y registra la más avanzada que necesitó. Así la dificultad refleja el razonamiento requerido y no solo la cantidad de pistas.",
        },
        {
          q: "¿Se guarda mi progreso?",
          a: "Sí. Los números, las notas, el tiempo y las pistas usadas se guardan automáticamente en el almacenamiento local de tu navegador.",
        },
      ],
      crossLink: { text: "¿Prefieres lápiz y papel?", label: "Imprime sudokus gratis" },
    },
    print: {
      title: "Sudokus para imprimir gratis (PDF) con soluciones",
      description:
        "Genera e imprime sudokus gratis en blanco y negro: de 1 a 9 por hoja, tamaños 4×4 a 12×12, cuatro niveles de dificultad, papel Carta o A4 y soluciones al final.",
      h1: "Sudokus para imprimir",
      lead: "Configura cuántos sudokus quieres, el tamaño y la dificultad, y obtén hojas limpias en blanco y negro listas para imprimir o guardar como PDF.",
      sections: [
        {
          title: "Cómo imprimir tus sudokus",
          list: [
            "Elige tamaño, dificultad y cantidad de sudokus.",
            "Decide cuántos sudokus quieres por hoja: 1, 2, 4, 6 o 9 según el tamaño.",
            "Selecciona papel Carta o A4 y, si quieres, incluye las soluciones al final.",
            "Pulsa Imprimir. En el diálogo puedes elegir tu impresora o “Guardar como PDF”.",
          ],
        },
        {
          title: "Pensado para papel",
          paragraphs: [
            "Las cuadrículas se dibujan en vectores, por lo que salen nítidas a cualquier tamaño y con líneas gruesas que separan claramente los bloques. Todo es en blanco y negro para ahorrar tinta, con espacio para anotar el número de sudoku y tu tiempo.",
            "Las soluciones se imprimen en hojas aparte, más compactas, con los números iniciales en negrita para que puedas revisar tu trabajo fácilmente.",
          ],
        },
        {
          title: "Ideas de uso",
          list: [
            "Cuadernillos de sudokus para viajes o fines de semana.",
            "Material para clases de matemáticas y lógica, con mini sudokus de 4×4 y 6×6 para niños.",
            "Actividades de estimulación cognitiva para adultos mayores.",
            "Retos expertos de 9×9 o 12×12 para competir con amigos.",
          ],
        },
      ],
      faqTitle: "Preguntas frecuentes",
      faq: [
        {
          q: "¿Puedo descargar los sudokus en PDF?",
          a: "Sí. Al pulsar Imprimir, elige “Guardar como PDF” como destino en el diálogo de impresión de tu navegador.",
        },
        {
          q: "¿Por qué mis hojas tienen márgenes extra o encabezados?",
          a: "En el diálogo de impresión, elige márgenes “Ninguno” y desactiva “Encabezados y pies de página”. Las hojas ya incluyen sus propios márgenes.",
        },
        {
          q: "¿Los sudokus impresos tienen solución única?",
          a: "Sí. Se usan el mismo generador y el mismo calificador de dificultad que en el juego en línea.",
        },
      ],
      crossLink: { text: "¿Prefieres jugar en pantalla?", label: "Juega sudoku online" },
    },
  },
  en: {
    play: {
      title: "Free Online Sudoku: Easy, Medium, Hard and Expert",
      description:
        "Play free online sudoku with no sign-up. Boards from 4×4 to 12×12, four difficulty levels, notes, explained hints, a timer and automatic progress saving.",
      h1: "Free online sudoku",
      lead: "Pick a size and difficulty and start playing instantly. Every sudoku is generated in your browser and has exactly one solution.",
      sections: [
        {
          title: "How to play sudoku",
          paragraphs: [
            "The goal is to fill the board so that every row, every column and every box contains each number exactly once. Classic 9×9 sudoku uses the numbers 1 to 9 and is divided into nine 3×3 boxes.",
            "Select a cell and type a number using the on-screen keypad or your keyboard. Turn on notes mode to pencil in small candidates while you reason. If you get stuck, a hint shows you the next logical step and explains why.",
          ],
        },
        {
          title: "Difficulty levels",
          items: [
            { term: "Easy", text: "Plenty of starting clues. Just find cells where only one number fits." },
            { term: "Medium", text: "Fewer clues. Sometimes you'll need locked candidates inside a box." },
            { term: "Hard", text: "Requires naked or hidden pairs and triples, plus locked candidates." },
            {
              term: "Expert",
              text: "Demands advanced techniques such as X-Wing, Y-Wing or Swordfish, yet is always solvable with logic, no guessing.",
            },
          ],
        },
        {
          title: "Board sizes",
          paragraphs: [
            "Besides classic 9×9 sudoku you can play 4×4 and 6×6 mini sudokus, great for kids and beginners, an 8×8 with 2×4 boxes, and a giant 12×12 sudoku that uses the letters A, B and C for the values 10, 11 and 12.",
          ],
        },
        {
          title: "Features that help you play",
          list: [
            "Highlight duplicate numbers in a row, column or box.",
            "Show mistakes by checking against the solution.",
            "Manual notes and auto notes with every candidate.",
            "Hints that explain the technique: single candidate or single possible spot.",
            "Unlimited undo, a pausable timer and personal bests.",
            "Your game is saved in the browser, so you can close the tab and continue later.",
            "Dark mode and a layout that works on phone, tablet and desktop.",
          ],
        },
      ],
      faqTitle: "Frequently asked questions",
      faq: [
        {
          q: "Is it free? Do I need an account?",
          a: "Yes, it's completely free and no account is needed. Everything runs in your browser and no data is sent to a server.",
        },
        {
          q: "Does every sudoku have a single solution?",
          a: "Yes. After each board is generated, a solver verifies that exactly one solution exists before it's shown to you.",
        },
        {
          q: "How is difficulty decided?",
          a: "A logic solver works through the sudoku using human techniques and records the most advanced one it needed. That way difficulty reflects the reasoning required, not just the number of clues.",
        },
        {
          q: "Is my progress saved?",
          a: "Yes. Your numbers, notes, time and hints used are saved automatically in your browser's local storage.",
        },
      ],
      crossLink: { text: "Prefer pencil and paper?", label: "Print free sudokus" },
    },
    print: {
      title: "Free Printable Sudoku Puzzles (PDF) with Solutions",
      description:
        "Generate and print free black-and-white sudoku puzzles: 1 to 9 per page, sizes 4×4 to 12×12, four difficulty levels, Letter or A4 paper and answer keys at the end.",
      h1: "Printable sudoku puzzles",
      lead: "Choose how many sudokus you want, the size and the difficulty, and get clean black-and-white sheets ready to print or save as PDF.",
      sections: [
        {
          title: "How to print your sudokus",
          list: [
            "Choose size, difficulty and number of puzzles.",
            "Decide how many puzzles per page: 1, 2, 4, 6 or 9 depending on size.",
            "Pick Letter or A4 paper and optionally include solutions at the end.",
            "Press Print. In the dialog you can choose your printer or “Save as PDF”.",
          ],
        },
        {
          title: "Designed for paper",
          paragraphs: [
            "Grids are drawn as vectors, so they print crisp at any size with bold lines that clearly separate the boxes. Everything is black and white to save ink, with room to write the puzzle number and your time.",
            "Solutions are printed on separate, more compact pages, with the starting numbers in bold so you can check your work easily.",
          ],
        },
        {
          title: "Ideas for using them",
          list: [
            "Sudoku booklets for trips or weekends.",
            "Math and logic classroom material, with 4×4 and 6×6 mini sudokus for kids.",
            "Brain-training activities for seniors.",
            "Expert 9×9 or 12×12 challenges to compete with friends.",
          ],
        },
      ],
      faqTitle: "Frequently asked questions",
      faq: [
        {
          q: "Can I download the sudokus as a PDF?",
          a: "Yes. When you press Print, choose “Save as PDF” as the destination in your browser's print dialog.",
        },
        {
          q: "Why do my pages have extra margins or headers?",
          a: "In the print dialog, set margins to “None” and turn off “Headers and footers”. The sheets already include their own margins.",
        },
        {
          q: "Do printed sudokus have a unique solution?",
          a: "Yes. They use the same generator and difficulty grader as the online game.",
        },
      ],
      crossLink: { text: "Prefer playing on screen?", label: "Play sudoku online" },
    },
  },
}
