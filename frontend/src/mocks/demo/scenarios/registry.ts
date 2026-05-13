import { fallbackScenario } from './fallback'
import { restrictedScenario } from './restricted'
import type { Scenario } from './types'

// Scenarios are matched in declaration order; more specific scenarios MUST be
// declared before more generic ones. The fallback MUST stay last.
export const SCENARIOS: Scenario[] = [
  // Tasks 13-18 insert role-specific scenarios above the fallback.
  fallbackScenario,
]

export { restrictedScenario }
