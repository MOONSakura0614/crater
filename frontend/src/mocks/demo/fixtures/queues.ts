export interface DemoQueue {
  name: string
  capacity: number
  used: number
  pending: number
  gpuModel: string
  description: string
}

export const DEMO_QUEUES: DemoQueue[] = [
  {
    name: 'gpu-l40s',
    capacity: 16,
    used: 16,
    pending: 12,
    gpuModel: 'NVIDIA L40S',
    description: '高性能 L40S 队列，48G 显存',
  },
  {
    name: 'gpu-3090',
    capacity: 32,
    used: 18,
    pending: 3,
    gpuModel: 'NVIDIA RTX3090',
    description: '通用 3090 队列，24G 显存',
  },
  {
    name: 'gpu-a100',
    capacity: 8,
    used: 6,
    pending: 0,
    gpuModel: 'NVIDIA A100',
    description: 'A100 队列，80G 显存（仅限大模型预训练）',
  },
  {
    name: 'cpu',
    capacity: 256,
    used: 100,
    pending: 4,
    gpuModel: '-',
    description: '通用 CPU 队列（无 GPU）',
  },
]
