import { f } from '../sse/frames'
import type { Scenario } from './types'

export const aliceJs2Failed: Scenario = {
  id: 'alice-js2-failed',
  role: 'user',
  triggers: [
    ['失败', '为什么'],
    ['nlp-train-001', '失败'],
    ['nlp-train-001', '错误'],
    ['nlp-train-001', '原因'],
    ['nlp-train-001', '挂'],
    ['nlp-train-001', '报错'],
    ['failed', 'why'],
    ['挂了', '作业'],
    ['看下', '原因'],
    ['报错', '排查'],
    ['错', '帮我'],
    ['作业', '失败'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`

    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield { delayMs: 400, frame: f.status('coordinator', '入口判断：作业失败诊断任务') }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器拆分证据收集') }

    yield {
      delayMs: 600,
      frame: f.status(
        'planner',
        '拆分 5 步：1) 作业详情 2) 事件 3) 容器日志 4) 资源指标 5) 历史相似失败'
      ),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '移交探索器') }

    yield {
      delayMs: 500,
      frame: f.toolStart('get_job_detail', { name: 'nlp-train-001' }, 'tc-js2-1'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'get_job_detail',
        'tc-js2-1',
        'status=Failed, exitCode=137, duration=37min',
        { toolArgs: { name: 'nlp-train-001' } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('get_job_events', { name: 'nlp-train-001' }, 'tc-js2-2'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'get_job_events',
        'tc-js2-2',
        '关键事件：pod OOMKilled (Reason=Memory), Last State: Terminated, ExitCode 137',
        { toolArgs: { name: 'nlp-train-001' } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('get_container_logs', { name: 'nlp-train-001', tail: 200 }, 'tc-js2-3'),
    }
    yield {
      delayMs: 1100,
      frame: f.toolDone(
        'get_container_logs',
        'tc-js2-3',
        '日志末尾出现 CUDA out of memory. Tried to allocate 2.00 GiB ... 触发 OOMKilled',
        { toolArgs: { name: 'nlp-train-001', tail: 200 } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart(
        'query_job_metrics',
        { name: 'nlp-train-001', metrics: ['gpu_memory'] },
        'tc-js2-4'
      ),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'query_job_metrics',
        'tc-js2-4',
        'GPU 显存峰值 23.6/24.0 GiB（持续 8 秒），平均 21.4 GiB',
        { toolArgs: { name: 'nlp-train-001', metrics: ['gpu_memory'] } }
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('query_similar_failures', { reason: 'OOMKilled' }, 'tc-js2-5'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'query_similar_failures',
        'tc-js2-5',
        '过去 7 天 3 例相同失败，均在 batch=64 + 16G 显存配置下复现',
        { toolArgs: { reason: 'OOMKilled' } }
      ),
    }

    yield { delayMs: 500, frame: f.handoff('explorer', 'verifier', '证据收集完毕') }
    yield {
      delayMs: 700,
      frame: f.handoff(
        'verifier',
        'coordinator',
        '退出码 137 + OOMKilled 事件 + 显存峰值 23.6G + 历史模式三重证据互证',
        'pass'
      ),
    }

    yield {
      delayMs: 700,
      frame: f.finalAnswer(
        `**根因**：CUDA 显存不足，触发 OOMKiller（退出码 137）。\n\n**证据链**\n- 显存峰值 23.6/24.0 GiB，超过申请上限\n- 历史 3 例同样模式（batch=64 + 16G 显存）\n- 容器日志末尾出现 \`CUDA out of memory\`\n\n**推荐方案**\n\n| 方案 | 改动 | 预期效果 |\n|---|---|---|\n| A | batch size 64 → 32 | 立即可重提，显存降到 ~12G |\n| B | 显存申请 16G → 24G | 保持 batch=64，需切换到 L40S 队列 |\n| C | 启用 gradient accumulation | 等效 batch=64 但显存压缩 ~40% |`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 200, frame: f.done() }
  },
}
