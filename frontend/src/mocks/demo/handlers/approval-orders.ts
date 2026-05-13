import { HttpResponse, http } from 'msw'

import { findAccountByToken } from '../accounts'
import { DEMO_APPROVAL_ORDERS, findOrder, ordersForUser } from '../fixtures/approval-orders'

const baseURL = '/'

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, msg: '', data })
}

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
}

export const approvalOrderHandlers = [
  // User: own orders
  http.get(`${baseURL}api/v1/approvalorder`, ({ request }) => {
    const account = findAccountByToken(bearer(request))
    if (!account) return ok([])
    if (account.role === 'admin') return ok(DEMO_APPROVAL_ORDERS)
    return ok(ordersForUser(account.username))
  }),

  // Admin: all orders
  http.get(`${baseURL}api/v1/admin/approvalorder`, () => ok(DEMO_APPROVAL_ORDERS)),

  // User: single order detail
  http.get(`${baseURL}api/v1/approvalorder/:id`, ({ params }) => {
    const order = findOrder(Number(params.id))
    return order
      ? ok(order)
      : HttpResponse.json({ code: 40400, msg: 'not found', data: null }, { status: 404 })
  }),

  // Admin: single order detail
  http.get(`${baseURL}api/v1/admin/approvalorder/:id`, ({ params }) => {
    const order = findOrder(Number(params.id))
    return order
      ? ok(order)
      : HttpResponse.json({ code: 40400, msg: 'not found', data: null }, { status: 404 })
  }),

  // List by name
  http.get(`${baseURL}api/v1/approvalorder/name/:name`, ({ params }) =>
    ok(DEMO_APPROVAL_ORDERS.filter((o) => o.name === String(params.name)))
  ),

  // Create
  http.post(`${baseURL}api/v1/approvalorder`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: 9000 + Math.floor(Math.random() * 1000),
      name: String(body.name ?? `order-${Date.now()}`),
      type: String(body.type ?? 'job_extension'),
      status: 'Pending',
      content: {
        approvalorderTypeID: Number(body.approvalorderTypeID ?? 1),
        approvalorderReason: String(body.approvalorderReason ?? ''),
        approvalorderExtensionHours: Number(body.approvalorderExtensionHours ?? 0),
      },
      reviewNotes: '',
      creator: { username: 'alice', nickname: 'Alice 研究员' },
      reviewer: { username: '', nickname: '' },
      createdAt: new Date().toISOString(),
      reviewSource: '',
      agentReport: '',
    })
  }),

  // Update (admin approval action)
  http.put(`${baseURL}api/v1/approvalorder/:id`, async ({ params, request }) => {
    const order = findOrder(Number(params.id))
    if (!order)
      return HttpResponse.json({ code: 40400, msg: 'not found', data: null }, { status: 404 })
    const body = (await request.json()) as Record<string, unknown>
    order.status = (body.status as typeof order.status) ?? order.status
    order.reviewNotes = String(body.reviewNotes ?? order.reviewNotes)
    order.reviewSource = 'admin_manual'
    return ok(order)
  }),

  // Delete
  http.delete(`${baseURL}api/v1/approvalorder/:id`, ({ params }) => {
    const idx = DEMO_APPROVAL_ORDERS.findIndex((o) => o.id === Number(params.id))
    if (idx >= 0) DEMO_APPROVAL_ORDERS.splice(idx, 1)
    return ok({ id: Number(params.id) })
  }),
]
