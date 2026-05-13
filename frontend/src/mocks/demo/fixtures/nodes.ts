export interface DemoNode {
  name: string
  status: 'Ready' | 'NotReady' | 'Degraded'
  role: 'gpu' | 'cpu'
  gpuModel?: string
  gpuTotal: number
  gpuUsed: number
  cpuTotal: string
  cpuUsed: string
  memoryTotal: string
  memoryUsed: string
  taints?: string[]
  conditions: Array<{ type: string; status: string; reason?: string; message?: string }>
  events: Array<{ time: string; reason: string; message: string }>
}

export const DEMO_NODES: DemoNode[] = [
  {
    name: 'gpu-node-01',
    status: 'Ready',
    role: 'gpu',
    gpuModel: 'NVIDIA L40S',
    gpuTotal: 4,
    gpuUsed: 4,
    cpuTotal: '128',
    cpuUsed: '92',
    memoryTotal: '512Gi',
    memoryUsed: '380Gi',
    conditions: [
      { type: 'Ready', status: 'True' },
      { type: 'GPUHealthy', status: 'True' },
    ],
    events: [],
  },
  {
    name: 'gpu-node-02',
    status: 'Ready',
    role: 'gpu',
    gpuModel: 'NVIDIA L40S',
    gpuTotal: 4,
    gpuUsed: 4,
    cpuTotal: '128',
    cpuUsed: '88',
    memoryTotal: '512Gi',
    memoryUsed: '372Gi',
    conditions: [
      { type: 'Ready', status: 'True' },
      { type: 'GPUHealthy', status: 'True' },
    ],
    events: [],
  },
  {
    name: 'gpu-node-03',
    status: 'Degraded',
    role: 'gpu',
    gpuModel: 'NVIDIA L40S',
    gpuTotal: 4,
    gpuUsed: 3,
    cpuTotal: '128',
    cpuUsed: '60',
    memoryTotal: '512Gi',
    memoryUsed: '256Gi',
    conditions: [
      { type: 'Ready', status: 'True' },
      {
        type: 'GPUHealthy',
        status: 'False',
        reason: 'XidError',
        message: 'Xid 79: GPU has fallen off the bus',
      },
    ],
    events: [
      { time: '2026-05-13T02:14:00Z', reason: 'XidError', message: 'GPU 0 Xid 79' },
      { time: '2026-05-13T03:48:00Z', reason: 'XidError', message: 'GPU 0 Xid 79' },
      { time: '2026-05-13T05:21:00Z', reason: 'XidError', message: 'GPU 0 Xid 79' },
      { time: '2026-05-13T07:02:00Z', reason: 'XidError', message: 'GPU 0 Xid 79' },
    ],
  },
  {
    name: 'gpu-node-04',
    status: 'Ready',
    role: 'gpu',
    gpuModel: 'NVIDIA A100',
    gpuTotal: 8,
    gpuUsed: 6,
    cpuTotal: '256',
    cpuUsed: '180',
    memoryTotal: '1024Gi',
    memoryUsed: '720Gi',
    conditions: [
      { type: 'Ready', status: 'True' },
      { type: 'GPUHealthy', status: 'True' },
    ],
    events: [],
  },
  {
    name: 'gpu-node-05',
    status: 'Ready',
    role: 'gpu',
    gpuModel: 'NVIDIA RTX3090',
    gpuTotal: 8,
    gpuUsed: 5,
    cpuTotal: '128',
    cpuUsed: '70',
    memoryTotal: '512Gi',
    memoryUsed: '300Gi',
    conditions: [
      { type: 'Ready', status: 'True' },
      { type: 'GPUHealthy', status: 'True' },
    ],
    events: [],
  },
  {
    name: 'cpu-node-01',
    status: 'Ready',
    role: 'cpu',
    gpuTotal: 0,
    gpuUsed: 0,
    cpuTotal: '256',
    cpuUsed: '100',
    memoryTotal: '512Gi',
    memoryUsed: '180Gi',
    conditions: [{ type: 'Ready', status: 'True' }],
    events: [],
  },
]

export function findNode(name: string): DemoNode | undefined {
  return DEMO_NODES.find((n) => n.name === name)
}
