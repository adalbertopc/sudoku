import { generatePuzzle, type Puzzle } from "./generator"
import type { GenerateMessage, GenerateRequest } from "./worker"

export interface GenerateJob {
  promise: Promise<Puzzle[]>
  cancel: () => void
}

export function generateInWorker(
  request: GenerateRequest,
  onProgress?: (done: number, total: number) => void,
): GenerateJob {
  if (typeof Worker === "undefined") {
    const puzzles = Array.from({ length: request.count }, () => generatePuzzle(request.size, request.difficulty))
    return { promise: Promise.resolve(puzzles), cancel: () => {} }
  }
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  let rejectFn: (reason: unknown) => void = () => {}
  const promise = new Promise<Puzzle[]>((resolve, reject) => {
    rejectFn = reject
    worker.onmessage = (event: MessageEvent<GenerateMessage>) => {
      const data = event.data
      if (data.type === "progress") onProgress?.(data.done, data.total)
      if (data.type === "done") {
        resolve(data.puzzles)
        worker.terminate()
      }
      if (data.type === "error") {
        reject(new Error(data.message))
        worker.terminate()
      }
    }
    worker.onerror = (event) => {
      reject(new Error(event.message))
      worker.terminate()
    }
    worker.postMessage(request)
  })
  return {
    promise,
    cancel: () => {
      worker.terminate()
      rejectFn(new DOMException("Cancelado", "AbortError"))
    },
  }
}
