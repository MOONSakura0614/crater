import { f } from '../sse/frames'
import type { Scenario } from './types'

export const restrictedScenario: Scenario = {
  id: 'restricted',
  role: 'both',
  triggers: [],
  async *run(ctx) {
    yield { delayMs: 200, frame: f.runStarted('turn-restricted', 'coordinator') }
    yield {
      delayMs: 400,
      frame: f.thinking(
        ctx.role === 'user'
          ? '检测到该问题涉及平台管理员能力，当前账号 (alice) 权限不足。'
          : '检测到该问题与普通用户视角更贴合。'
      ),
    }
    yield {
      delayMs: 500,
      frame: f.finalAnswer(
        ctx.role === 'user'
          ? '此操作需要平台管理员权限，普通用户无法触发。可联系运维或切换 sysadmin 账户演示该场景。'
          : '该问题与普通用户视角更相关，建议切换 alice 账户继续演示。',
        ctx.sessionId
      ),
    }
    yield { delayMs: 100, frame: f.done() }
  },
}
