import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'
import { agentRestHandlers } from './handlers/agent-rest'
import { aiopsHandlers } from './handlers/aiops'
import { authHandlers } from './handlers/auth'
import { opsReportHandlers } from './handlers/ops-report'
import { peripheralHandlers } from './handlers/peripheral'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  return [
    ...authHandlers,
    ...aiopsHandlers,
    ...opsReportHandlers,
    ...agentRestHandlers,
    ...peripheralHandlers,
  ]
}
