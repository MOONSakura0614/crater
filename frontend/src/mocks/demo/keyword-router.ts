import { restrictedScenario, SCENARIOS } from './scenarios/registry'
import type { DemoRole, Scenario } from './scenarios/types'

function normalize(input: string): string {
  return input.toLowerCase().replace(/[\s,，。？?!！、:.;；'"`()（）]+/g, '')
}

export function pickScenario(message: string, role: DemoRole): Scenario {
  const text = normalize(message)
  let restrictedMatch: Scenario | null = null

  for (const scenario of SCENARIOS) {
    if (scenario.triggers.length === 0) continue
    const matched = scenario.triggers.some((group) =>
      group.every((kw) => text.includes(normalize(kw)))
    )
    if (!matched) continue
    if (scenario.role === 'both' || scenario.role === role) return scenario
    restrictedMatch = scenario
  }

  if (restrictedMatch) return restrictedScenario
  // Fallback scenario is always the last entry.
  return SCENARIOS[SCENARIOS.length - 1]
}
