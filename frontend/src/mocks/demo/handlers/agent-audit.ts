import { HttpResponse, http } from 'msw'

import { DEMO_AGENT_SESSIONS, findSessionBundle } from '../fixtures/agent-sessions'
import { demoAuditDetail, demoAuditSessionsResult } from '../fixtures/audit-sessions'
import { DEMO_QUALITY_EVALS, evalsForSession } from '../fixtures/quality-evals'

const baseURL = '*/'

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, msg: '', data })
}

export const agentAuditHandlers = [
  http.get(`${baseURL}api/v1/admin/agent/sessions`, ({ request }) => {
    const url = new URL(request.url)
    const source = url.searchParams.get('source') ?? ''
    const keyword = url.searchParams.get('keyword') ?? ''
    const result = demoAuditSessionsResult()
    let items = result.items
    if (source && source !== 'all') items = items.filter((i) => i.source === source)
    if (keyword) {
      const kw = keyword.toLowerCase()
      items = items.filter(
        (i) => i.title.toLowerCase().includes(kw) || (i.username ?? '').toLowerCase().includes(kw)
      )
    }
    return ok({ ...result, items, total: items.length })
  }),

  http.get(`${baseURL}api/v1/admin/agent/sessions/:id/detail`, ({ params }) => {
    const detail = demoAuditDetail(String(params.id))
    if (!detail) return ok(null)
    return ok(detail)
  }),

  http.get(`${baseURL}api/v1/admin/agent/sessions/:id/messages`, ({ params }) => {
    const bundle = findSessionBundle(String(params.id))
    return ok(
      (bundle?.messages ?? []).map((m) => ({
        id: Number(m.id.split('-').pop()),
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        toolCalls: null,
        toolCallId: null,
        toolName: null,
        metadata: null,
        createdAt: m.createdAt,
      }))
    )
  }),

  http.get(`${baseURL}api/v1/admin/agent/sessions/:id/tool-calls`, ({ params }) => {
    const bundle = findSessionBundle(String(params.id))
    return ok(
      (bundle?.toolCalls ?? []).map((tc, i) => ({
        id: i + 1,
        sessionId: bundle?.session.sessionId ?? '',
        turnId: tc.turnId,
        messageId: null,
        toolCallId: tc.toolCallId,
        agentId: tc.agentId,
        parentEventId: null,
        agentRole: tc.agentRole,
        source: tc.source ?? 'backend',
        toolName: tc.toolName,
        toolArgs: tc.toolArgs,
        toolResult: tc.toolResult,
        resultStatus: tc.resultStatus,
        executionBackend: 'mock',
        sandboxJobName: null,
        scriptName: null,
        resultArtifactRef: null,
        egressDomains: [],
        latencyMs: 600 + i * 80,
        tokenCount: 320 + i * 40,
        userConfirmed: tc.userConfirmed ?? null,
        createdAt: tc.createdAt,
      }))
    )
  }),

  http.get(`${baseURL}api/v1/admin/agent/sessions/:id/turns`, ({ params }) =>
    ok(findSessionBundle(String(params.id))?.turns ?? [])
  ),

  http.get(`${baseURL}api/v1/admin/agent/turns/:id/events`, ({ params }) => {
    const turnId = String(params.id)
    for (const b of DEMO_AGENT_SESSIONS) {
      const evs = b.events.filter((e) => e.turnId === turnId)
      if (evs.length > 0) return ok(evs)
    }
    return ok([])
  }),

  http.get(`${baseURL}api/v1/admin/agent/quality-evals`, ({ request }) => {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const list = sessionId ? evalsForSession(sessionId) : DEMO_QUALITY_EVALS
    return ok(list)
  }),

  http.post(
    `${baseURL}api/v1/admin/agent/sessions/:id/trigger-eval`,
    async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>
      const sessionId = String(params.id)
      return ok({
        evalId: 9000 + Math.floor(Math.random() * 1000),
        sessionId,
        turnId: body.turnId ?? '',
        evalScope: body.evalScope ?? 'session',
        evalType: body.evalType ?? 'full',
        evalStatus: 'completed',
        triggerSource: 'manual',
        createdAt: new Date().toISOString(),
      })
    }
  ),
]
