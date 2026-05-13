import type { IHealthOverview } from '@/services/api/aiops'

export const DEMO_HEALTH_USER: IHealthOverview = {
  totalJobs: 12,
  failedJobs: 2,
  pendingJobs: 1,
  runningJobs: 9,
  failureRate: 0.167,
  failureTrend: [
    { date: '2026-05-07', count: 1 },
    { date: '2026-05-08', count: 0 },
    { date: '2026-05-09', count: 1 },
    { date: '2026-05-10', count: 0 },
    { date: '2026-05-11', count: 0 },
    { date: '2026-05-12', count: 1 },
    { date: '2026-05-13', count: 2 },
  ],
  topFailureReasons: [
    { reason: 'CUDA out of memory', count: 2 },
    { reason: 'Image pull backoff', count: 1 },
  ],
}

export const DEMO_HEALTH_ADMIN: IHealthOverview = {
  totalJobs: 318,
  failedJobs: 27,
  pendingJobs: 15,
  runningJobs: 276,
  failureRate: 0.085,
  failureTrend: [
    { date: '2026-05-07', count: 18 },
    { date: '2026-05-08', count: 22 },
    { date: '2026-05-09', count: 14 },
    { date: '2026-05-10', count: 19 },
    { date: '2026-05-11', count: 26 },
    { date: '2026-05-12', count: 24 },
    { date: '2026-05-13', count: 27 },
  ],
  topFailureReasons: [
    { reason: 'CUDA out of memory', count: 11 },
    { reason: 'Image pull backoff', count: 6 },
    { reason: 'Node Xid error', count: 4 },
    { reason: 'PVC mount failure', count: 3 },
    { reason: 'Quota exceeded', count: 3 },
  ],
}
