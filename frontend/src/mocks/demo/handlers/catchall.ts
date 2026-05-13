import { HttpResponse, http } from 'msw'

const baseURL = '*/'

// Generic 200-empty fallback for any v1 GET/POST/PUT/DELETE so unrouted page
// reads don't 500. MUST come last in the handler array (MSW matches in order,
// first wins).
export const catchallHandlers = [
  http.get(`${baseURL}api/v1/*`, () =>
    HttpResponse.json({ code: 0, msg: 'mocked-empty', data: { items: [], total: 0 } })
  ),
  http.post(`${baseURL}api/v1/*`, () =>
    HttpResponse.json({ code: 0, msg: 'mocked-empty', data: {} })
  ),
  http.put(`${baseURL}api/v1/*`, () =>
    HttpResponse.json({ code: 0, msg: 'mocked-empty', data: {} })
  ),
  http.delete(`${baseURL}api/v1/*`, () =>
    HttpResponse.json({ code: 0, msg: 'mocked-empty', data: {} })
  ),
  // Non-v1 auth endpoints (e.g. /api/auth/check) are handled by authHandlers
  // explicitly, but other /api/* unrouted reads still benefit from a fallback.
  http.get(`${baseURL}api/*`, () =>
    HttpResponse.json({ code: 0, msg: 'mocked-empty', data: undefined })
  ),
]
