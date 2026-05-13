import type { RequestHandler } from 'msw'

import { isDemoMode } from './env'
import { agentAuditHandlers } from './handlers/agent-audit'
import { agentRestHandlers } from './handlers/agent-rest'
import { agentSseHandlers } from './handlers/agent-sse'
import { aiopsHandlers } from './handlers/aiops'
import { approvalOrderHandlers } from './handlers/approval-orders'
import { authHandlers } from './handlers/auth'
import { catchallHandlers } from './handlers/catchall'
import { opsReportHandlers } from './handlers/ops-report'
import { peripheralHandlers } from './handlers/peripheral'

export function getDemoHandlers(): RequestHandler[] {
  if (!isDemoMode()) return []
  // Order matters: explicit handlers first (SSE before REST so /v1/agent/chat
  // doesn't get swallowed), catchall LAST.
  return [
    ...authHandlers,
    ...agentSseHandlers,
    ...aiopsHandlers,
    ...opsReportHandlers,
    ...agentAuditHandlers,
    ...agentRestHandlers,
    ...approvalOrderHandlers,
    ...peripheralHandlers,
    ...catchallHandlers,
  ]
}
