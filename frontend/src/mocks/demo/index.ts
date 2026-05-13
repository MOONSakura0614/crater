import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  // Handlers will be aggregated here as subsequent tasks add modules.
  return []
}
