import { f } from '../sse/frames'
import type { Scenario } from './types'

export const aliceJs1Pending: Scenario = {
  id: 'alice-js1-pending',
  role: 'user',
  triggers: [
    ['排队', '为什么'],
    ['pending', 'wait'],
    ['my-train-job', '卡'],
    ['my-train-job', '排队'],
    ['my-train-job', '没运行'],
    ['my-train-job', '没跑'],
    ['调度', '不到'],
    ['怎么', '还没运行'],
    ['为什么', '没跑'],
    ['作业', '排队'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`

    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield { delayMs: 400, frame: f.status('coordinator', '入口判断：作业状态查询任务（low risk）') }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器拆分调查步骤') }

    yield {
      delayMs: 600,
      frame: f.status('planner', '拆分为：1) 队列容量 2) 用户配额 3) 节点资源 4) 调度事件'),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '移交探索器收集只读证据') }

    yield {
      delayMs: 500,
      frame: f.toolStart('query_queue_status', { queue: 'gpu-l40s' }, 'tc-js1-1'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'query_queue_status',
        'tc-js1-1',
        '队列 gpu-l40s 容量 16，已用 16，待调度 12 个作业',
        { toolArgs: { queue: 'gpu-l40s' } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('query_user_quota', { account: 'nlp-lab' }, 'tc-js1-2'),
    }
    yield {
      delayMs: 800,
      frame: f.toolDone(
        'query_user_quota',
        'tc-js1-2',
        '账户 nlp-lab GPU 配额 6/8（剩 2），my-train-job 申请 2 GPU 在配额内',
        { toolArgs: { account: 'nlp-lab' } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('query_cluster_capacity', { gpu_type: 'l40s' }, 'tc-js1-3'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'query_cluster_capacity',
        'tc-js1-3',
        'L40S 共 4 台节点：2 台 Ready（全占用），2 台维护中',
        { toolArgs: { gpu_type: 'l40s' } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('query_recent_scheduler_events', { job: 'my-train-job' }, 'tc-js1-4'),
    }
    yield {
      delayMs: 800,
      frame: f.toolDone(
        'query_recent_scheduler_events',
        'tc-js1-4',
        '过去 30 分钟内 8 次 ScheduleFailed，全部因 InsufficientGPU',
        { toolArgs: { job: 'my-train-job' } }
      ),
    }

    yield { delayMs: 500, frame: f.handoff('explorer', 'verifier', '证据收集完毕，移交验证器复核') }
    yield {
      delayMs: 700,
      frame: f.handoff('verifier', 'coordinator', '证据链完整，结论可支撑', 'pass'),
    }

    yield {
      delayMs: 700,
      frame: f.finalAnswer(
        `**诊断结论**\n\n作业 \`my-train-job\` 处于 Pending 是由集群侧资源不足导致：\n\n- 队列 \`gpu-l40s\` 已满载（16/16），还有 12 个作业排队\n- 2 张 L40S 处于维护，预计 35 分钟后恢复\n- 你的账户配额（GPU 6/8）并非瓶颈\n\n**建议**\n\n1. 切换到 \`gpu-3090\` 队列（当前 18/32，几乎零等待）\n2. 或继续等待，预计 ~35 分钟后开始调度`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 200, frame: f.done() }
  },
}
