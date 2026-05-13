import { f } from '../sse/frames'
import type { Scenario } from './types'

export const fallbackScenario: Scenario = {
  id: 'fallback',
  role: 'both',
  triggers: [],
  async *run(ctx) {
    yield { delayMs: 200, frame: f.runStarted('turn-fallback', 'coordinator') }
    yield {
      delayMs: 600,
      frame: f.thinking(
        '当前输入未匹配到演示剧本。可参考 docs/zh-CN/demo-recording-guide.md 中给出的推荐问题，或换一种说法再试。'
      ),
    }
    yield {
      delayMs: 500,
      frame: f.finalAnswer(
        '抱歉，本次演示尚未覆盖该问题。可尝试以下角度：\n\n- 作业为什么排队 / 失败\n- 停止某个作业\n- 集群巡检 / 节点排查 / 批量停止空跑作业\n\n详见 `docs/zh-CN/demo-recording-guide.md`。',
        ctx.sessionId
      ),
    }
    yield { delayMs: 100, frame: f.done() }
  },
}
