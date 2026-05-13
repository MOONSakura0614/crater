import { HttpResponse, http } from 'msw'

import type { IDiagnosis } from '@/services/api/aiops'

import { DEMO_HEALTH_ADMIN, DEMO_HEALTH_USER } from '../fixtures/health'
import { findJob } from '../fixtures/jobs'

const baseURL = '*/'

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, msg: '', data })
}

function diagnose(jobName: string): IDiagnosis {
  const job = findJob(jobName)
  if (!job) {
    return {
      jobName,
      status: 'Unknown',
      category: 'unknown',
      diagnosis: '未找到该作业',
      solution: '请确认作业名',
      confidence: 'low',
      severity: 'info',
      evidence: {},
    }
  }
  if (job.status === 'Failed') {
    return {
      jobName,
      status: 'Failed',
      category: 'oom',
      diagnosis: `作业 ${jobName} 因 CUDA 显存不足被 OOM Killer 终止（退出码 137）`,
      solution: '建议把 batch size 从 64 降到 32，或将 GPU 显存请求提升到 24G',
      confidence: 'high',
      severity: 'error',
      evidence: {
        exitCode: 137,
        exitReason: 'OOMKilled',
        events: [
          `pod ${jobName}-master-0 OOMKilled`,
          'GPU memory peaked at 23.6/24.0 GiB',
          'similar failure pattern matched: 3 jobs in past 7 days',
        ],
      },
    }
  }
  return {
    jobName,
    status: job.status,
    category: 'pending',
    diagnosis: `作业 ${jobName} 当前 ${job.status}，原因：${job.reason ?? '资源等待'}`,
    solution: '可考虑切换到 gpu-3090 队列或等待约 35 分钟',
    confidence: 'medium',
    severity: 'warning',
    evidence: { events: ['queue gpu-l40s pending=12, capacity=16/16'] },
  }
}

export const aiopsHandlers = [
  http.get(`${baseURL}api/v1/aiops/health-overview`, () => ok(DEMO_HEALTH_USER)),
  http.get(`${baseURL}api/v1/admin/aiops/health-overview`, () => ok(DEMO_HEALTH_ADMIN)),
  http.get(`${baseURL}api/v1/aiops/diagnose/:job`, ({ params }) =>
    ok(diagnose(decodeURIComponent(String(params.job))))
  ),
  http.get(`${baseURL}api/v1/admin/aiops/diagnose/:job`, ({ params }) =>
    ok(diagnose(decodeURIComponent(String(params.job))))
  ),
]
