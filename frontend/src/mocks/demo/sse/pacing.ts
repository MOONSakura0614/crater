import { DEMO_PACING_KEY } from '../env'

type Speed = 'FAST' | 'NORMAL' | 'SLOW'

const PRESETS: Record<Speed, number> = {
  FAST: 0.4,
  NORMAL: 1,
  SLOW: 2.2,
}

export function speedFactor(): number {
  if (typeof window === 'undefined') return 1
  const raw = window.localStorage.getItem(DEMO_PACING_KEY) as Speed | null
  return raw && raw in PRESETS ? PRESETS[raw] : 1
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms * speedFactor()))
}
