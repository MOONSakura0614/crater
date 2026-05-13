import { HttpResponse, http } from 'msw'

// IMPORTANT: relative-path patterns are mandatory here.
// A leading-`/` path is matched by MSW v2 as a literal path prefix
// against the *current origin only*. Earlier we used `*/api/v1/*`
// which MSW v2 expands to `.*/api/v1/.*` and that accidentally
// matched vite source files like `/src/services/api/aiops.ts`
// (the path contains the substring `/api/`), returning JSON instead
// of JS and breaking dynamic imports across the whole app.
const baseURL = '/'

// Generic 200-empty fallback for any v1 GET/POST/PUT/DELETE so unrouted page
// reads don't 500. MUST come last in the handler array (MSW matches in order,
// first wins). We deliberately scope this to `/api/v1/*` only — non-v1 paths
// like `/api/auth/*` are handled explicitly by authHandlers, and an over-broad
// `/api/*` catchall would also swallow non-API requests that happen to share
// the substring.
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
]
