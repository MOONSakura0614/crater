import type { PipelineReportPayload } from '@/services/api/agent'

import { f } from '../sse/frames'
import type { Scenario } from './types'

const REPORT: PipelineReportPayload = {
  reportId: 'pipe-ad1-2026-05-13',
  reportType: 'cluster_inspection',
  completedAt: '2026-05-13T08:30:00Z',
  summary: { total_scanned: 318, idle_detected: 7, gpu_waste_hours: 23.5 },
  summary_labels: {
    total_label: '扫描作业',
    middle_label: '检出空跑',
    right_label: 'GPU 浪费时长',
  },
  categories: [
    {
      action: '节点异常',
      severity: 'critical',
      count: 1,
      items: [
        { job_name: 'gpu-node-03', user: '-', gpu_util: 'Xid Error', duration: '14h' },
      ],
    },
    {
      action: '排队拥塞',
      severity: 'warning',
      count: 1,
      items: [
        { job_name: 'gpu-l40s 队列', user: '-', gpu_util: '16/16', duration: 'pending=12' },
      ],
    },
    {
      action: 'GPU 利用率偏低',
      severity: 'info',
      count: 7,
      items: Array.from({ length: 7 }).map((_, i) => ({
        job_name: `idle-train-${String(i + 1).padStart(2, '0')}`,
        user: ['bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry'][i],
        gpu_util: (0.02 + i * 0.005).toFixed(3),
        duration: `${140 + i * 10}m`,
        gpu_requested: 1,
        gpu_actual: 0,
      })),
    },
  ],
}

export const adminAd1Inspection: Scenario = {
  id: 'admin-ad1-inspection',
  role: 'admin',
  triggers: [
    ['巡检'],
    ['集群', '状况'],
    ['集群', '健康'],
    ['集群', '整体'],
    ['今天', '情况'],
    ['health', 'report'],
    ['整体', '怎么样'],
    ['平台', '整体'],
    ['日报'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`
    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield { delayMs: 400, frame: f.status('coordinator', '识别为巡检流水线任务（管理员）') }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器') }

    yield {
      delayMs: 600,
      frame: f.status('planner', '安排 5 步：1) 健康概览 2) 节点 3) 队列 4) 空跑作业 5) 近期失败'),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '执行巡检流水线') }

    const tools: Array<[string, string]> = [
      ['get_cluster_health', '集群总作业 318，成功率 86.8%，失败 27'],
      ['list_nodes', '共 6 节点，gpu-node-03 出现 Xid 错误'],
      ['query_queue_status', 'gpu-l40s 满载，pending=12；gpu-3090 18/32'],
      ['detect_idle_jobs', '检出 7 个 GPU 利用率 <5% 持续 2h+ 的作业'],
      ['query_recent_failures', '过去 24h 27 个失败，OOM 占 11 例'],
    ]
    for (let i = 0; i < tools.length; i++) {
      const [name, summary] = tools[i]
      const tcid = `tc-ad1-${i + 1}`
      yield { delayMs: 400, frame: f.toolStart(name, {}, tcid) }
      yield { delayMs: 900, frame: f.toolDone(name, tcid, summary) }
    }

    yield { delayMs: 500, frame: f.handoff('explorer', 'verifier', '证据汇总完毕') }
    yield {
      delayMs: 700,
      frame: f.handoff('verifier', 'coordinator', '证据覆盖 5 个维度', 'pass'),
    }

    yield { delayMs: 600, frame: f.pipelineReport(REPORT) }
    yield {
      delayMs: 800,
      frame: f.finalAnswer(
        `**巡检完成**：检出 1 个 critical（节点异常）、1 个 warning（队列拥塞）、7 个 info（GPU 利用率偏低）。预计可回收 23.5 GPU·h。\n\n**建议优先处理**\n\n1. gpu-node-03 出现 Xid 错误：立即 cordon 后联系运维换卡\n2. gpu-l40s 队列长期满载：引导新作业切换到 gpu-3090\n3. 7 个空跑作业：批量停止释放 23.5 GPU·h`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 200, frame: f.done() }
  },
}
