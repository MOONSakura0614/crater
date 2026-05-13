import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'
import { authHandlers } from './handlers/auth'
import { peripheralHandlers } from './handlers/peripheral'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  return [...authHandlers, ...peripheralHandlers]
}
