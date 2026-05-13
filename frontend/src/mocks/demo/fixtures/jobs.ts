export interface DemoJob {
  name: string
  owner: string
  account: string
  queue: string
  status: 'Pending' | 'Running' | 'Failed' | 'Succeeded' | 'Stopped'
  jobType: string
  image: string
  gpuRequest: number
  cpuRequest: string
  memoryRequest: string
  createdAt: string
  startedAt?: string
  failedAt?: string
  reason?: string
  exitCode?: number
  gpuUtil?: number
}

const idleOwners = ['bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry'] as const
const idleAccounts = ['cv-lab', 'cv-lab', 'rec-lab', 'rec-lab', 'nlp-lab', 'rl-lab', 'rl-lab'] as const

export const DEMO_JOBS: DemoJob[] = [
  {
    name: 'my-train-job',
    owner: 'alice',
    account: 'nlp-lab',
    queue: 'gpu-l40s',
    status: 'Pending',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 2,
    cpuRequest: '8',
    memoryRequest: '32Gi',
    createdAt: '2026-05-13T08:12:00Z',
    reason: 'WaitingForResources',
  },
  {
    name: 'nlp-train-001',
    owner: 'alice',
    account: 'nlp-lab',
    queue: 'gpu-l40s',
    status: 'Failed',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 1,
    cpuRequest: '4',
    memoryRequest: '16Gi',
    createdAt: '2026-05-13T05:01:00Z',
    startedAt: '2026-05-13T05:05:00Z',
    failedAt: '2026-05-13T05:42:00Z',
    reason: 'CUDA out of memory',
    exitCode: 137,
    gpuUtil: 0.94,
  },
  {
    name: 'stuck-job-7',
    owner: 'alice',
    account: 'nlp-lab',
    queue: 'gpu-l40s',
    status: 'Running',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 4,
    cpuRequest: '16',
    memoryRequest: '64Gi',
    createdAt: '2026-05-12T18:00:00Z',
    startedAt: '2026-05-12T18:08:00Z',
    reason: 'NoProgress',
    gpuUtil: 0.03,
  },
  ...idleOwners.map((owner, i) => ({
    name: `idle-train-${String(i + 1).padStart(2, '0')}`,
    owner,
    account: idleAccounts[i],
    queue: i % 2 === 0 ? 'gpu-l40s' : 'gpu-3090',
    status: 'Running' as const,
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 1,
    cpuRequest: '4',
    memoryRequest: '16Gi',
    createdAt: '2026-05-12T10:00:00Z',
    startedAt: '2026-05-12T10:08:00Z',
    reason: 'IdleLowGpuUtil',
    gpuUtil: 0.02 + i * 0.005,
  })),
  // A handful of healthy running jobs to make admin views look populated
  {
    name: 'cv-train-12',
    owner: 'bob',
    account: 'cv-lab',
    queue: 'gpu-3090',
    status: 'Failed',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 2,
    cpuRequest: '8',
    memoryRequest: '32Gi',
    createdAt: '2026-05-13T04:00:00Z',
    startedAt: '2026-05-13T04:05:00Z',
    failedAt: '2026-05-13T04:20:00Z',
    reason: 'OOMKilled',
    exitCode: 137,
  },
  {
    name: 'rl-train-04',
    owner: 'henry',
    account: 'rl-lab',
    queue: 'gpu-l40s',
    status: 'Failed',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 1,
    cpuRequest: '4',
    memoryRequest: '16Gi',
    createdAt: '2026-05-13T03:00:00Z',
    startedAt: '2026-05-13T03:02:00Z',
    failedAt: '2026-05-13T03:30:00Z',
    reason: 'Node Xid error',
    exitCode: 139,
  },
  {
    name: 'big-job-1',
    owner: 'grace',
    account: 'rl-lab',
    queue: 'gpu-l40s',
    status: 'Failed',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 8,
    cpuRequest: '32',
    memoryRequest: '128Gi',
    createdAt: '2026-05-13T02:00:00Z',
    reason: 'Quota exceeded',
    exitCode: 0,
  },
  {
    name: 'data-prep-09',
    owner: 'dave',
    account: 'rec-lab',
    queue: 'gpu-3090',
    status: 'Failed',
    jobType: 'pytorch',
    image: 'pytorch-2.3:cu121',
    gpuRequest: 1,
    cpuRequest: '8',
    memoryRequest: '32Gi',
    createdAt: '2026-05-13T01:00:00Z',
    reason: 'PVC mount failure',
    exitCode: 1,
  },
]

export function findJob(name: string): DemoJob | undefined {
  return DEMO_JOBS.find((j) => j.name === name)
}

export function jobsForOwner(owner: string): DemoJob[] {
  return DEMO_JOBS.filter((j) => j.owner === owner)
}
