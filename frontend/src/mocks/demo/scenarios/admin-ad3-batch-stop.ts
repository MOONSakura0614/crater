import type { BatchConfirmationPayload } from '@/services/api/agent'

import { f } from '../sse/frames'
import type { Scenario } from './types'

const candidates = Array.from({ length: 7 }).map((_, i) => ({
  job_name: `idle-train-${String(i + 1).padStart(2, '0')}`,
  user: ['bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry'][i],
  gpu_util: (0.02 + i * 0.005).toFixed(3),
  selected: i < 5,
}))

const BATCH: BatchConfirmationPayload = {
  batchId: 'batch-ad3-2026-05-13',
  action: 'stop_job',
  description: '批量停止 GPU 利用率 <5% 且运行 >2h 的空跑作业。可逐项勾选或反选。',
  items: candidates,
}

export const adminAd3BatchStop: Scenario = {
  id: 'admin-ad3-batch-stop',
  role: 'admin',
  triggers: [
    ['批量', '停'],
    ['空跑', '停'],
    ['空跑', '清理'],
    ['批量', '清理'],
    ['gpu', '5%', '停'],
    ['利用率低', '处理'],
    ['利用率低', '停'],
    ['把那些', '停'],
    ['idle', 'stop'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`
    const confirmId = `cfm-batch-${Date.now()}`
    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield {
      delayMs: 400,
      frame: f.status('coordinator', '识别为批量受控执行任务（high risk）'),
    }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器') }

    yield {
      delayMs: 600,
      frame: f.status(
        'planner',
        '步骤：1) 检出空跑候选 2) 列出影响作业 3) 生成批量确认 4) 用户勾选后执行 5) 验证'
      ),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '执行检出') }

    yield {
      delayMs: 500,
      frame: f.toolStart(
        'detect_idle_jobs',
        { gpu_util_threshold: 0.05, min_duration_hours: 2 },
        'tc-ad3-1'
      ),
    }
    yield {
      delayMs: 1000,
      frame: f.toolDone(
        'detect_idle_jobs',
        'tc-ad3-1',
        '检出 7 个候选作业（GPU 利用率 <5% 持续 2h+），合计可释放约 23.5 GPU·h',
        { toolArgs: { gpu_util_threshold: 0.05, min_duration_hours: 2 } }
      ),
    }

    yield { delayMs: 400, frame: f.handoff('explorer', 'executor', '移交执行器生成批量确认') }
    yield { delayMs: 600, frame: f.batchConfirmation(BATCH, confirmId) }
    yield { delayMs: 200, frame: f.done() }
  },
  async *resume(ctx) {
    const decision =
      (ctx.decisionPayload as {
        fields?: { items?: typeof candidates }
        decision?: string
        confirmed?: boolean
      }) ?? {}
    const rejected = decision.decision === 'reject' || decision.confirmed === false

    if (rejected) {
      yield { delayMs: 400, frame: f.status('executor', '用户取消批量操作') }
      yield {
        delayMs: 500,
        frame: f.finalAnswer('批量停止已取消，候选作业未做改动。', ctx.sessionId),
      }
      yield { delayMs: 100, frame: f.done() }
      return
    }

    const items = decision.fields?.items ?? candidates
    const selected = items.filter((i) => i.selected)

    yield {
      delayMs: 600,
      frame: f.status('executor', `开始批量停止 ${selected.length} 个作业（grace=30s）`),
    }

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i]
      const tcid = `tc-ad3-stop-${i + 1}`
      yield {
        delayMs: 350,
        frame: f.toolStart(
          'stop_job',
          { name: item.job_name, grace_period_seconds: 30 },
          tcid,
          'executor'
        ),
      }
      yield {
        delayMs: 600,
        frame: f.toolDone('stop_job', tcid, `${item.job_name} 已停止，释放 1 GPU`, {
          toolArgs: { name: item.job_name },
        }),
      }
    }

    yield { delayMs: 500, frame: f.handoff('executor', 'verifier', '批量执行完毕') }
    yield {
      delayMs: 700,
      frame: f.handoff(
        'verifier',
        'coordinator',
        `${selected.length}/${selected.length} 成功，无失败`,
        'pass'
      ),
    }

    yield {
      delayMs: 700,
      frame: f.finalAnswer(
        `**批量操作完成**\n\n- 已停止 ${selected.length} 个空跑作业\n- 实际释放 GPU：${selected.length} 张\n- 预计回收 ${(selected.length * 3.5).toFixed(1)} GPU·h\n- 通知已下发对应用户邮箱\n\n审计记录已写入。`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 100, frame: f.done() }
  },
}
