import type { Frame } from './frames'
import { sleep } from './pacing'

const encoder = new TextEncoder()

function encode(frame: Frame): Uint8Array {
  const dataLine = typeof frame.data === 'string' ? frame.data : JSON.stringify(frame.data ?? {})
  return encoder.encode(`event: ${frame.event}\ndata: ${dataLine}\n\n`)
}

export type Beat = { delayMs: number; frame: Frame }

export function streamFromBeats(
  beats: AsyncIterable<Beat> | Iterable<Beat>
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const beat of beats as AsyncIterable<Beat>) {
          if (beat.delayMs > 0) await sleep(beat.delayMs)
          controller.enqueue(encode(beat.frame))
          if (beat.frame.event === 'done') break
        }
      } finally {
        controller.close()
      }
    },
  })
}

export function sseResponse(
  beats: AsyncIterable<Beat> | Iterable<Beat>,
  init: { sessionId?: string } = {}
): Response {
  return new Response(streamFromBeats(beats), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...(init.sessionId ? { 'X-Agent-Session-ID': init.sessionId } : {}),
    },
  })
}
