import { f } from '../sse/frames'
import type { Scenario } from './types'

export const adminAd2Node: Scenario = {
  id: 'admin-ad2-node',
  role: 'admin',
  triggers: [
    ['gpu-node-03', '排查'],
    ['gpu-node-03', '分析'],
    ['gpu-node-03', '怎么回事'],
    ['gpu-node-03', '怎么'],
    ['节点', '异常'],
    ['节点', '排查'],
    ['oom', '节点'],
    ['xid'],
    ['节点', '故障'],
  ],
  async *run(ctx) {
    const turnId = `turn-${ctx.sessionId}-1`
    yield { delayMs: 200, frame: f.runStarted(turnId, 'coordinator') }
    yield { delayMs: 400, frame: f.status('coordinator', '识别为节点诊断任务') }
    yield { delayMs: 500, frame: f.handoff('coordinator', 'planner', '移交规划器') }

    yield {
      delayMs: 600,
      frame: f.status(
        'planner',
        '安排 4 步：1) 节点详情 2) 节点上作业 3) 节点事件 4) Prometheus 指标'
      ),
    }
    yield { delayMs: 400, frame: f.handoff('planner', 'explorer', '移交探索器') }

    yield {
      delayMs: 500,
      frame: f.toolStart('get_node_detail', { name: 'gpu-node-03' }, 'tc-ad2-1'),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'get_node_detail',
        'tc-ad2-1',
        'gpu-node-03: Ready=True, 但 Conditions.GPUHealthy=False（Xid 79: GPU has fallen off the bus）'
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('list_jobs_on_node', { node: 'gpu-node-03' }, 'tc-ad2-2'),
    }
    yield {
      delayMs: 800,
      frame: f.toolDone(
        'list_jobs_on_node',
        'tc-ad2-2',
        '3 个作业在该节点：bob/cv-train-12 (OOMKilled), henry/rl-train-04 (Failed), grace/big-job-1 (Quota)'
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart('get_node_events', { name: 'gpu-node-03' }, 'tc-ad2-3'),
    }
    yield {
      delayMs: 800,
      frame: f.toolDone(
        'get_node_events',
        'tc-ad2-3',
        '过去 6h 出现 4 次 Xid Error 事件，dmesg 显示 GPU 0 fallen off the bus'
      ),
    }

    yield {
      delayMs: 400,
      frame: f.toolStart(
        'query_prometheus',
        { query: 'DCGM_FI_DEV_XID_ERRORS{Hostname="gpu-node-03"}' },
        'tc-ad2-4'
      ),
    }
    yield {
      delayMs: 900,
      frame: f.toolDone(
        'query_prometheus',
        'tc-ad2-4',
        '过去 1h DCGM Xid 错误计数 4，峰值 02:14 UTC；同期 NVLink 错误未异常'
      ),
    }

    yield { delayMs: 500, frame: f.handoff('explorer', 'verifier', '证据收集完毕') }
    yield {
      delayMs: 700,
      frame: f.handoff(
        'verifier',
        'coordinator',
        '4 个独立来源（K8s 状态 / 作业失败模式 / 节点事件 / Prometheus 指标）一致指向 GPU 硬件故障',
        'pass'
      ),
    }

    yield {
      delayMs: 800,
      frame: f.finalAnswer(
        `**根因**：gpu-node-03 的 GPU 0 出现 Xid 79（GPU has fallen off the bus），属硬件故障。\n\n**影响**\n- 3 个作业失败（bob/cv-train-12、henry/rl-train-04、grace/big-job-1）\n- 节点 GPUHealthy 条件失败\n\n**建议处理**\n1. 立即 \`kubectl cordon gpu-node-03\` 禁止新作业调度（推荐）\n2. 联系运维更换 GPU 模组\n3. 失败作业可在其他节点重提\n\n是否需要现在执行 cordon？（管理员可发起 cordon 工单）`,
        ctx.sessionId
      ),
    }
    yield { delayMs: 200, frame: f.done() }
  },
}
