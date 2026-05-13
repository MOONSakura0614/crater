export interface DemoQuota {
  accountId: number
  accountName: string
  gpu: { used: number; limit: number }
  cpu: { used: number; limit: number }
  memoryGi: { used: number; limit: number }
  storageGi: { used: number; limit: number }
}

export const DEMO_QUOTAS: DemoQuota[] = [
  {
    accountId: 2001,
    accountName: 'nlp-lab',
    gpu: { used: 6, limit: 8 },
    cpu: { used: 32, limit: 64 },
    memoryGi: { used: 256, limit: 512 },
    storageGi: { used: 1200, limit: 4000 },
  },
  {
    accountId: 2002,
    accountName: 'cv-lab',
    gpu: { used: 7, limit: 12 },
    cpu: { used: 40, limit: 96 },
    memoryGi: { used: 320, limit: 768 },
    storageGi: { used: 2200, limit: 5000 },
  },
  {
    accountId: 2003,
    accountName: 'rec-lab',
    gpu: { used: 4, limit: 8 },
    cpu: { used: 24, limit: 64 },
    memoryGi: { used: 180, limit: 512 },
    storageGi: { used: 900, limit: 4000 },
  },
  {
    accountId: 2004,
    accountName: 'rl-lab',
    gpu: { used: 9, limit: 12 },
    cpu: { used: 36, limit: 96 },
    memoryGi: { used: 280, limit: 768 },
    storageGi: { used: 1500, limit: 5000 },
  },
  {
    accountId: 1,
    accountName: 'platform',
    gpu: { used: 26, limit: 9999 },
    cpu: { used: 132, limit: 9999 },
    memoryGi: { used: 1036, limit: 99999 },
    storageGi: { used: 5800, limit: 99999 },
  },
]
