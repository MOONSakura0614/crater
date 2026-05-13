import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'
import { agentAuditHandlers } from './handlers/agent-audit'
import { agentRestHandlers } from './handlers/agent-rest'
import { aiopsHandlers } from './handlers/aiops'
import { authHandlers } from './handlers/auth'
import { catchallHandlers } from './handlers/catchall'
import { opsReportHandlers } from './handlers/ops-report'
import { peripheralHandlers } from './handlers/peripheral'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  // Order matters: explicit handlers first, catchall LAST.
  // (Scenario SSE handlers will be inserted before catchall in Task 12.)
  return [
    ...authHandlers,
    ...aiopsHandlers,
    ...opsReportHandlers,
    ...agentAuditHandlers,
    ...agentRestHandlers,
    ...peripheralHandlers,
    ...catchallHandlers,
  ]
}
