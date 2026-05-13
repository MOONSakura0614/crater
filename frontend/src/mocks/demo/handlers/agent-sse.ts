import { http } from 'msw'

import { findAccountByToken } from '../accounts'
import { pickScenario } from '../keyword-router'
import { SCENARIOS } from '../scenarios/registry'
import { setPendingConfirm, takePendingConfirm } from '../session-store'
import { f } from '../sse/frames'
import { type Beat, sseResponse } from '../sse/stream'

const baseURL = import.meta.env.VITE_SERVER_PROXY_BACKEND ?? ''

interface ChatBody {
  sessionId: string | null
  requestId?: string
  message: string
  orchestrationMode?: 'single_agent' | 'multi_agent'
  pageContext?: { jobName?: string; nodeName?: string; route?: string }
}

interface ResumeBody {
  confirmId: string
  fields?: Record<string, unknown>
  decision?: 'approve' | 'reject' | 'modify'
}

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
}

async function* persistConfirm(
  source: AsyncIterable<Beat>,
  scenarioId: string,
  sessionId: string
): AsyncIterable<Beat> {
  for await (const beat of source) {
    if (
      beat.frame.event === 'tool_call_confirmation_required' ||
      beat.frame.event === 'confirmation_required' ||
      beat.frame.event === 'batch_confirmation'
    ) {
      const data = beat.frame.data as { confirmId?: string }
      if (data.confirmId) {
        setPendingConfirm(data.confirmId, {
          scenarioId,
          payload: { sessionId, frameData: data },
          createdAt: Date.now(),
        })
      }
    }
    yield beat
  }
}

async function* noopRejectBeats(): AsyncIterable<Beat> {
  yield { delayMs: 200, frame: f.thinking('未找到对应的确认请求，可能已过期或会话已切换。') }
  yield {
    delayMs: 400,
    frame: f.finalAnswer('确认上下文已失效，请重新触发该操作。'),
  }
  yield { delayMs: 100, frame: f.done() }
}

export const agentSseHandlers = [
  http.post(`${baseURL}api/v1/agent/chat`, async ({ request }) => {
    const body = (await request.json()) as ChatBody
    const account = findAccountByToken(bearer(request))
    const role = account?.role ?? 'user'
    const username = account?.username ?? 'guest'
    const sessionId = body.sessionId ?? `sess-demo-${Date.now()}`
    const scenario = pickScenario(body.message ?? '', role)

    const beats = scenario.run({
      sessionId,
      requestId: body.requestId ?? `req-${Date.now()}`,
      message: body.message ?? '',
      role,
      username,
      pageContext: body.pageContext ?? {},
    })

    return sseResponse(persistConfirm(beats, scenario.id, sessionId), { sessionId })
  }),

  http.post(`${baseURL}api/v1/agent/chat/resume`, async ({ request }) => {
    const body = (await request.json()) as ResumeBody
    const account = findAccountByToken(bearer(request))
    const role = account?.role ?? 'user'
    const username = account?.username ?? 'guest'
    const record = takePendingConfirm(body.confirmId)
    if (!record) {
      return sseResponse(noopRejectBeats())
    }
    const scenario = SCENARIOS.find((s) => s.id === record.scenarioId)
    if (!scenario || !scenario.resume) {
      return sseResponse(noopRejectBeats())
    }
    const recoveredSessionId =
      (record.payload as { sessionId?: string } | null)?.sessionId ?? `sess-resume-${Date.now()}`
    const beats = scenario.resume({
      sessionId: recoveredSessionId,
      requestId: `req-${Date.now()}`,
      message: '',
      role,
      username,
      pageContext: {},
      confirmId: body.confirmId,
      decisionPayload: body,
    })
    return sseResponse(beats, { sessionId: recoveredSessionId })
  }),
]
