import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'
import { authHandlers } from './handlers/auth'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  return [...authHandlers]
}
