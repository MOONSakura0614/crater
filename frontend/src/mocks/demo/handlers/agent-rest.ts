import { HttpResponse, http } from 'msw'

import { findAccountByToken } from '../accounts'
import {
  DEMO_AGENT_SESSIONS,
  findSessionBundle,
  sessionsForRole,
} from '../fixtures/agent-sessions'

const baseURL = import.meta.env.VITE_SERVER_PROXY_BACKEND ?? ''

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, msg: '', data })
}

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
}

export const agentRestHandlers = [
  http.get(`${baseURL}api/v1/agent/sessions`, ({ request }) => {
    const account = findAccountByToken(bearer(request))
    const role = account?.role ?? 'user'
    return ok(sessionsForRole(role).map((b) => b.session))
  }),

  http.put(`${baseURL}api/v1/agent/sessions/:id/pin`, async ({ params, request }) => {
    const body = (await request.json()) as { pinned?: boolean }
    const bundle = findSessionBundle(decodeURIComponent(String(params.id)))
    if (bundle) {
      bundle.session.pinnedAt = body.pinned ? new Date().toISOString() : null
      return ok(bundle.session)
    }
    return ok(null)
  }),

  http.delete(`${baseURL}api/v1/agent/sessions/:id`, ({ params }) => {
    const id = decodeURIComponent(String(params.id))
    const idx = DEMO_AGENT_SESSIONS.findIndex((b) => b.session.sessionId === id)
    if (idx >= 0) DEMO_AGENT_SESSIONS.splice(idx, 1)
    return ok('ok')
  }),

  http.get(`${baseURL}api/v1/agent/sessions/:id/messages`, ({ params }) =>
    ok(findSessionBundle(decodeURIComponent(String(params.id)))?.messages ?? [])
  ),

  http.get(`${baseURL}api/v1/agent/sessions/:id/tool-calls`, ({ params }) =>
    ok(findSessionBundle(decodeURIComponent(String(params.id)))?.toolCalls ?? [])
  ),

  http.get(`${baseURL}api/v1/agent/sessions/:id/turns`, ({ params }) =>
    ok(findSessionBundle(decodeURIComponent(String(params.id)))?.turns ?? [])
  ),

  http.get(`${baseURL}api/v1/agent/turns/:id/events`, ({ params }) => {
    const turnId = decodeURIComponent(String(params.id))
    for (const b of DEMO_AGENT_SESSIONS) {
      const evs = b.events.filter((e) => e.turnId === turnId)
      if (evs.length > 0) return ok(evs)
    }
    return ok([])
  }),

  http.get(`${baseURL}api/v1/agent/config-summary`, () =>
    ok({ defaultOrchestrationMode: 'multi_agent' })
  ),

  // chat/confirm — fulfilled here as a regular 200 ack; the actual SSE resume
  // is triggered by the frontend via /chat/resume in the agent-sse handler.
  http.post(`${baseURL}api/v1/agent/chat/confirm`, () =>
    ok({ status: 'accepted', message: '已接受确认' })
  ),

  http.post(`${baseURL}api/v1/agent/chat/parameter-update`, () => ok({ status: 'accepted' })),

  // Feedback endpoints (PUT upsert, POST submit/quick-submit/enrich, GET list/stats)
  http.put(`${baseURL}api/v1/agent/feedbacks`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: Date.now(),
      sessionId: String(body.sessionId ?? ''),
      userId: 1,
      accountId: 1,
      targetType: body.targetType,
      targetId: body.targetId,
      rating: body.rating,
      tags: body.tags ?? [],
      dimensions: body.dimensions ?? {},
      comment: body.comment ?? '',
      status: 'draft',
      submittedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.post(`${baseURL}api/v1/agent/feedbacks/submit`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: Date.now(),
      sessionId: String(body.sessionId ?? ''),
      userId: 1,
      accountId: 1,
      targetType: body.targetType,
      targetId: body.targetId,
      rating: 1,
      tags: [],
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.post(`${baseURL}api/v1/agent/feedbacks/quick-submit`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: Date.now(),
      sessionId: String(body.sessionId ?? ''),
      userId: 1,
      accountId: 1,
      targetType: body.targetType,
      targetId: body.targetId,
      rating: body.rating,
      tags: body.tags ?? [],
      dimensions: body.dimensions ?? {},
      comment: body.comment ?? '',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.put(`${baseURL}api/v1/agent/feedbacks/enrich`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: Date.now(),
      sessionId: String(body.sessionId ?? ''),
      userId: 1,
      accountId: 1,
      targetType: body.targetType,
      targetId: body.targetId,
      rating: 1,
      tags: body.tags ?? [],
      dimensions: body.dimensions ?? {},
      comment: body.comment ?? '',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.get(`${baseURL}api/v1/agent/feedbacks`, ({ request }) => {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId') ?? ''
    const bundle = findSessionBundle(sessionId)
    if (!bundle) return ok([])
    // Build a couple of submitted feedback entries for alice's sessions
    if (bundle.ownerUsername !== 'alice') return ok([])
    return ok([
      {
        id: 1,
        sessionId: bundle.session.sessionId,
        userId: 1001,
        accountId: 2001,
        targetType: 'turn',
        targetId: bundle.turns[0].turnId,
        rating: 1,
        tags: ['解答到位'],
        dimensions: { relevance: 5, accuracy: 5, helpfulness: 5 },
        comment: '诊断思路清晰，工具调用合理',
        status: 'submitted',
        submittedAt: bundle.session.updatedAt,
        createdAt: bundle.session.updatedAt,
        updatedAt: bundle.session.updatedAt,
      },
    ])
  }),
  http.get(`${baseURL}api/v1/agent/feedbacks/stats`, () =>
    ok({
      total: 12,
      thumbsUp: 11,
      thumbsDown: 1,
      avgDimensions: { relevance: 4.7, accuracy: 4.6, helpfulness: 4.8 },
      topTags: [
        { tag: '解答到位', count: 6 },
        { tag: '工具用得对', count: 4 },
        { tag: '风险提醒清晰', count: 3 },
      ],
    })
  ),
]
