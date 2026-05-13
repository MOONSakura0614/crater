import type { Beat } from '../sse/stream'

export type DemoRole = 'user' | 'admin'

export interface ScenarioCtx {
  sessionId: string
  requestId: string
  message: string
  role: DemoRole
  username: string
  pageContext: { jobName?: string; nodeName?: string; route?: string }
}

export interface ConfirmCtx extends ScenarioCtx {
  confirmId: string
  decisionPayload: unknown
}

export interface Scenario {
  id: string
  role: DemoRole | 'both'
  /**
   * Each inner array is a keyword group; all keywords in the group must be
   * present in the (normalized) user message for the group to match. Multiple
   * groups are OR-ed.
   */
  triggers: string[][]
  /** Pre-confirmation segment (always runs). */
  run: (ctx: ScenarioCtx) => AsyncIterable<Beat>
  /** Optional post-confirm segment, executed by /chat/resume after user decision. */
  resume?: (ctx: ConfirmCtx) => AsyncIterable<Beat>
}
