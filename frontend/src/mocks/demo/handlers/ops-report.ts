import { HttpResponse, http } from 'msw'

import {
  DEMO_OPS_AUDIT_ITEMS,
  DEMO_OPS_REPORT_DETAIL,
  DEMO_OPS_REPORT_LIST,
} from '../fixtures/ops-reports'

const baseURL = '*/'

export const opsReportHandlers = [
  http.get(`${baseURL}api/v1/admin/agent/ops-reports`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('page_size') ?? 20)
    const start = (page - 1) * pageSize
    const slice = DEMO_OPS_REPORT_LIST.slice(start, start + pageSize)
    return HttpResponse.json({ total: DEMO_OPS_REPORT_LIST.length, items: slice })
  }),

  http.get(`${baseURL}api/v1/admin/agent/ops-reports/latest`, () =>
    HttpResponse.json(DEMO_OPS_REPORT_DETAIL)
  ),

  http.get(`${baseURL}api/v1/admin/agent/ops-reports/:id`, ({ params }) => {
    if (String(params.id) === DEMO_OPS_REPORT_DETAIL.id) {
      return HttpResponse.json(DEMO_OPS_REPORT_DETAIL)
    }
    // For the prior-day report, return a thinner detail
    const list = DEMO_OPS_REPORT_LIST.find((r) => r.id === String(params.id))
    if (list) return HttpResponse.json({ ...list, report_json: null })
    return HttpResponse.json({}, { status: 404 })
  }),

  http.get(`${baseURL}api/v1/admin/agent/ops-reports/:id/items`, ({ params, request }) => {
    if (String(params.id) !== DEMO_OPS_REPORT_DETAIL.id) {
      return HttpResponse.json({ total: 0, items: [] })
    }
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const severity = url.searchParams.get('severity')
    const items = DEMO_OPS_AUDIT_ITEMS.filter(
      (it) => (!category || it.category === category) && (!severity || it.severity === severity)
    )
    return HttpResponse.json({ total: items.length, items })
  }),
]
