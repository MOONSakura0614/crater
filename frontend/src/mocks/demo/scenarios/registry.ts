import { adminAd1Inspection } from './admin-ad1-inspection'
import { adminAd2Node } from './admin-ad2-node'
import { adminAd3BatchStop } from './admin-ad3-batch-stop'
import { aliceJs1Pending } from './alice-js1-pending'
import { aliceJs2Failed } from './alice-js2-failed'
import { aliceJs3Stop } from './alice-js3-stop'
import { fallbackScenario } from './fallback'
import { restrictedScenario } from './restricted'
import type { Scenario } from './types'

// Scenarios are matched in declaration order; more specific scenarios MUST be
// declared before more generic ones. The fallback MUST stay last.
//
// Within the same role, the rule of thumb is:
//   1) Stop / batch (high-risk, named entity triggers come first)
//   2) Failure diagnosis (named-job triggers)
//   3) Pending diagnosis (named-job triggers)
//   4) Node investigation (named-node triggers)
//   5) Inspection (general keywords)
//   6) Fallback (always last)
export const SCENARIOS: Scenario[] = [
  // Admin: high-specificity first
  adminAd3BatchStop,
  adminAd2Node,
  adminAd1Inspection,
  // Alice
  aliceJs3Stop,
  aliceJs2Failed,
  aliceJs1Pending,
  // Generic
  fallbackScenario,
]

export { restrictedScenario }
