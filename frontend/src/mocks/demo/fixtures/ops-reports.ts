import type {
  OpsAuditItem,
  OpsReportDetail,
  OpsReportListItem,
} from '@/services/api/ops-report'

const REPORT_ID = 'rpt-2026-05-13-001'

export const DEMO_OPS_REPORT_LIST: OpsReportListItem[] = [
  {
    id: REPORT_ID,
    report_type: 'daily',
    status: 'completed',
    trigger_source: 'cron',
    summary: { jobs_scanned: 318, anomalies: 7 },
    period_start: '2026-05-12T00:00:00Z',
    period_end: '2026-05-13T00:00:00Z',
    job_total: 318,
    job_success: 276,
    job_failed: 27,
    job_pending: 15,
    created_at: '2026-05-13T01:00:00Z',
  },
  {
    id: 'rpt-2026-05-12-001',
    report_type: 'daily',
    status: 'completed',
    trigger_source: 'cron',
    summary: { jobs_scanned: 302, anomalies: 5 },
    period_start: '2026-05-11T00:00:00Z',
    period_end: '2026-05-12T00:00:00Z',
    job_total: 302,
    job_success: 280,
    job_failed: 18,
    job_pending: 4,
    created_at: '2026-05-12T01:00:00Z',
  },
]

export const DEMO_OPS_REPORT_DETAIL: OpsReportDetail = {
  ...DEMO_OPS_REPORT_LIST[0],
  report_json: {
    executive_summary:
      '过去 24 小时检测到 27 个失败作业、7 个低利用率作业、1 个降级节点。集群整体可用性 91.5%。',
    job_overview: {
      total: 318,
      success: 276,
      failed: 27,
      pending: 15,
      success_rate: 0.868,
      delta: { total: 16, failed: 9, pending: 11 },
    },
    failure_analysis: {
      categories: [
        { reason: 'CUDA out of memory', count: 11, top_job: { name: 'nlp-train-001', owner: 'alice' } },
        { reason: 'Image pull backoff', count: 6, top_job: { name: 'cv-train-12', owner: 'bob' } },
        { reason: 'Node Xid error', count: 4, top_job: { name: 'rl-train-04', owner: 'henry' } },
        { reason: 'PVC mount failure', count: 3, top_job: { name: 'data-prep-09', owner: 'dave' } },
        { reason: 'Quota exceeded', count: 3, top_job: { name: 'big-job-1', owner: 'grace' } },
      ],
      top_affected_users: ['alice', 'bob', 'henry'],
      patterns: '集中在 gpu-l40s 队列、深夜批量提交后 30 分钟内失败',
    },
    success_analysis: {
      avg_duration_by_type: { pytorch: 4820, tensorflow: 6300, vllm: 1800 },
      resource_efficiency: { avg_cpu_ratio: 0.42, avg_gpu_ratio: 0.71, avg_memory_ratio: 0.58 },
    },
    resource_utilization: {
      cluster_gpu_avg: 0.71,
      cluster_cpu_avg: 0.45,
      cluster_memory_avg: 0.62,
      over_provisioned_count: 14,
      idle_gpu_jobs: 7,
      node_hotspots: ['gpu-node-01', 'gpu-node-04'],
    },
    recommendations: [
      { severity: 'high', text: '节点 gpu-node-03 出现 Xid 错误，建议 cordon 并联系运维换卡' },
      { severity: 'high', text: '7 个 GPU 利用率 <5% 持续 2 小时的作业可批量停止释放 23.5 GPU·h' },
      { severity: 'medium', text: 'gpu-l40s 队列长期满载，可引导部分作业切换到 gpu-3090' },
      { severity: 'low', text: '建议为 image pull backoff 高发用户配置 harbor 国内镜像' },
    ],
  },
}

const idleOwners = ['bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry'] as const

export const DEMO_OPS_AUDIT_ITEMS: OpsAuditItem[] = [
  ...idleOwners.map((owner, i) => ({
    id: i + 1,
    report_id: REPORT_ID,
    job_name: `idle-train-${String(i + 1).padStart(2, '0')}`,
    username: owner,
    action_type: 'idle_low_gpu',
    severity: 'warning',
    category: 'idle',
    job_type: 'pytorch',
    owner,
    namespace: 'crater',
    duration_seconds: 8400 + i * 600,
    gpu_utilization: 0.02 + i * 0.005,
    gpu_requested: 1,
    gpu_actual_used: 0,
    resource_requested: { cpu: '4', memory: '16Gi', gpu: 1 } as Record<string, unknown>,
    resource_actual: { cpu: '0.3', memory: '6Gi', gpu: 0 } as Record<string, unknown>,
    exit_code: null,
    failure_reason: null,
    analysis_detail: { idle_minutes: 140 + i * 10 } as Record<string, unknown>,
    handled: false,
    created_at: '2026-05-13T01:00:00Z',
  })),
  {
    id: 8,
    report_id: REPORT_ID,
    job_name: 'gpu-node-03',
    username: null,
    action_type: 'node_degraded',
    severity: 'critical',
    category: 'node',
    job_type: null,
    owner: null,
    namespace: null,
    duration_seconds: null,
    gpu_utilization: null,
    gpu_requested: null,
    gpu_actual_used: null,
    resource_requested: null,
    resource_actual: null,
    exit_code: null,
    failure_reason: 'Xid 79: GPU has fallen off the bus',
    analysis_detail: { affected_jobs: 3 } as Record<string, unknown>,
    handled: false,
    created_at: '2026-05-13T01:00:00Z',
  },
]
