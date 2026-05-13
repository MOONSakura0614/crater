import { f } from '../sse/frames'
import type { Scenario } from './types'

export const aliceJs3Stop: Scenario = {
  id: 'alice-js3-stop',
  role: 'user',
  triggers: [
    ['停止', 'stuck-job-7'],
    ['stuck-job-7', '停'],
    ['stuck-job-7', 'kill'],
    ['stuck-job-7', 'stop'],
    ['kill', '停掉'],
    ['释放', 'stuck-job-7'],
    ['释放', '资源'],
    ['把这个', '停'],
    ['停掉', '这个'],
    ['帮我', '停'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`
    const confirmId = `cfm-stop-${Date.now()}`
    const toolCallId = `tc-js3-stop`

    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield {
      delayMs: 400,
      frame: f.status('coordinator', '识别为受控执行任务（high risk: stop_job）'),
    }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器') }

    yield {
      delayMs: 500,
      frame: f.status(
        'planner',
        '安排三步：1) 确认作业仍在运行 2) 评估影响面 3) 准备停止（需用户确认）'
      ),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '移交探索器先行验证') }

    yield { delayMs: 500, frame: f.toolStart('get_job_detail', { name: 'stuck-job-7' }, 'tc-js3-1') }
    yield {
      delayMs: 800,
      frame: f.toolDone(
        'get_job_detail',
        'tc-js3-1',
        'status=Running, 占用 4 GPU, 启动 14 小时',
        { toolArgs: { name: 'stuck-job-7' } }
      ),
    }
    yield {
      delayMs: 400,
      frame: f.toolStart('check_job_dependents', { name: 'stuck-job-7' }, 'tc-js3-2'),
    }
    yield {
      delayMs: 700,
      frame: f.toolDone('check_job_dependents', 'tc-js3-2', '未发现下游联动作业', {
        toolArgs: { name: 'stuck-job-7' },
      }),
    }

    yield { delayMs: 400, frame: f.handoff('explorer', 'executor', '前置检查通过，移交执行器') }
    yield {
      delayMs: 600,
      frame: f.toolStart('stop_job', { name: 'stuck-job-7' }, toolCallId, 'executor'),
    }
    yield {
      delayMs: 600,
      frame: f.confirmation(
        confirmId,
        toolCallId,
        '即将停止作业 stuck-job-7。该作业占用 4 GPU，已运行 14 小时，未发现下游依赖。确认前请核对参数。',
        {
          title: '确认停止作业',
          description: '停止后将立即释放 GPU 资源。建议保留 30 秒优雅终止时间以保存检查点。',
          submitLabel: '确认停止',
          fields: [
            { key: 'job_name', label: '作业名', type: 'text', required: true, defaultValue: 'stuck-job-7' },
            { key: 'reason', label: '停止原因（可选）', type: 'textarea', required: false, placeholder: '便于审计回溯' },
            {
              key: 'grace_period_seconds',
              label: '优雅终止（秒）',
              type: 'number',
              defaultValue: 30,
            },
          ],
        }
      ),
    }
    yield { delayMs: 200, frame: f.done() }
  },
  async *resume(ctx) {
    const decision =
      (ctx.decisionPayload as { decision?: string; fields?: Record<string, unknown>; confirmed?: boolean }) ?? {}
    const rejected = decision.decision === 'reject' || decision.confirmed === false

    if (rejected) {
      yield { delayMs: 300, frame: f.status('executor', '用户拒绝执行，停止动作未发起') }
      yield {
        delayMs: 500,
        frame: f.finalAnswer(
          '已收到拒绝信号。stuck-job-7 仍在运行，未做改动。如需后续处理，可重新发起停止或转交管理员审批。',
          ctx.sessionId
        ),
      }
      yield { delayMs: 100, frame: f.done() }
      return
    }

    const fields = (decision.fields ?? {}) as { grace_period_seconds?: number; reason?: string }
    const grace = fields.grace_period_seconds ?? 30

    yield {
      delayMs: 400,
      frame: f.toolStart('stop_job', { name: 'stuck-job-7', grace_period_seconds: grace }, 'tc-js3-stop-exec', 'executor'),
    }
    yield {
      delayMs: 1000,
      frame: f.toolDone(
        'stop_job',
        'tc-js3-stop-exec',
        `已发送停止信号，grace_period=${grace}s`,
        { toolArgs: { name: 'stuck-job-7', grace_period_seconds: grace } }
      ),
    }

    yield { delayMs: 400, frame: f.handoff('executor', 'verifier', '执行完毕，移交验证器复核') }
    yield {
      delayMs: 500,
      frame: f.toolStart('get_job_detail', { name: 'stuck-job-7' }, 'tc-js3-3', 'verifier'),
    }
    yield {
      delayMs: 700,
      frame: f.toolDone('get_job_detail', 'tc-js3-3', 'status=Stopped, GPU 已释放（4 张）', {
        toolArgs: { name: 'stuck-job-7' },
      }),
    }

    yield {
      delayMs: 500,
      frame: f.handoff('verifier', 'coordinator', '操作结果与意图一致', 'pass'),
    }
    yield {
      delayMs: 600,
      frame: f.finalAnswer(
        `**执行完成**\n\n- 作业 \`stuck-job-7\` 已停止\n- 释放 GPU：4 张（L40S）\n- 优雅终止：${grace}s${fields.reason ? `\n- 原因记录：${fields.reason}` : ''}\n- 未发现联动作业受影响\n\n审计记录已写入。`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 100, frame: f.done() }
  },
}
