export interface DemoImage {
  name: string
  tag: string
  fullRef: string
  framework: string
  cudaVersion: string
  size: string
  pulls: number
  authorized: boolean
  description: string
}

export const DEMO_IMAGES: DemoImage[] = [
  {
    name: 'pytorch',
    tag: '2.3-cu121',
    fullRef: 'pytorch-2.3:cu121',
    framework: 'PyTorch 2.3',
    cudaVersion: 'CUDA 12.1',
    size: '8.4 GB',
    pulls: 1820,
    authorized: true,
    description: '官方 PyTorch 2.3 + CUDA 12.1，已包含 transformers/datasets/accelerate',
  },
  {
    name: 'tensorflow',
    tag: '2.15-cu121',
    fullRef: 'tensorflow-2.15:cu121',
    framework: 'TensorFlow 2.15',
    cudaVersion: 'CUDA 12.1',
    size: '7.1 GB',
    pulls: 540,
    authorized: true,
    description: 'TensorFlow 2.15 + CUDA 12.1',
  },
  {
    name: 'vllm',
    tag: '0.6-cu124',
    fullRef: 'vllm-0.6:cu124',
    framework: 'vLLM 0.6',
    cudaVersion: 'CUDA 12.4',
    size: '11.2 GB',
    pulls: 312,
    authorized: true,
    description: 'vLLM 推理引擎，A100/L40S 推荐',
  },
]
