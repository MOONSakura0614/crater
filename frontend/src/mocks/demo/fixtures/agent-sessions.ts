import type {
  AgentEvent,
  AgentMessage,
  AgentSession,
  AgentToolCall,
  AgentTurn,
} from '@/services/api/agent'

export interface DemoSessionBundle {
  session: AgentSession
  messages: AgentMessage[]
  toolCalls: AgentToolCall[]
  turns: AgentTurn[]
  events: AgentEvent[]
  ownerUsername: string
}

const ts = (offsetMin: number): string =>
  new Date(Date.parse('2026-05-13T08:00:00Z') + offsetMin * 60_000).toISOString()

function buildBundle(args: {
  ownerUsername: string
  sessionId: string
  title: string
  startedOffsetMin: number
  endedOffsetMin: number
  userMessage: string
  assistantMessage: string
  tools: Array<{ name: string; args: Record<string, unknown>; result: unknown; role: string }>
  events: Array<{ role: string; type: string; summary: string; verification?: string }>
  source?: AgentSession['source']
}): DemoSessionBundle {
  const turnId = `turn-${args.sessionId}-1`
  return {
    ownerUsername: args.ownerUsername,
    session: {
      sessionId: args.sessionId,
      title: args.title,
      source: args.source ?? 'chat',
      messageCount: 2,
      lastOrchestrationMode: 'multi_agent',
      pinnedAt: null,
      createdAt: ts(args.startedOffsetMin),
      updatedAt: ts(args.endedOffsetMin),
    },
    messages: [
      {
        id: `${args.sessionId}-m-1`,
        sessionId: args.sessionId,
        role: 'user',
        content: args.userMessage,
        createdAt: ts(args.startedOffsetMin),
      },
      {
        id: `${args.sessionId}-m-2`,
        sessionId: args.sessionId,
        role: 'assistant',
        content: args.assistantMessage,
        createdAt: ts(args.endedOffsetMin),
      },
    ],
    toolCalls: args.tools.map((t, i) => ({
      id: `${args.sessionId}-tc-${i + 1}`,
      turnId,
      toolCallId: `${args.sessionId}-tc-${i + 1}`,
      agentId: `${t.role}-agent-1`,
      source: 'backend',
      agentRole: t.role,
      toolName: t.name,
      toolArgs: t.args,
      toolResult: t.result,
      resultStatus: 'success',
      userConfirmed: t.name.startsWith('stop_') || t.name.startsWith('batch_') ? true : null,
      createdAt: ts(args.startedOffsetMin + 1 + i),
    })),
    turns: [
      {
        id: 1,
        turnId,
        sessionId: args.sessionId,
        requestId: `${args.sessionId}-req-1`,
        orchestrationMode: 'multi_agent',
        rootAgentId: 'coordinator-agent-1',
        status: 'completed',
        finalMessageId: null,
        startedAt: ts(args.startedOffsetMin),
        endedAt: ts(args.endedOffsetMin),
        createdAt: ts(args.startedOffsetMin),
        updatedAt: ts(args.endedOffsetMin),
      },
    ],
    events: args.events.map((e, i) => ({
      id: i + 1,
      turnId,
      sessionId: args.sessionId,
      agentId: `${e.role}-agent-1`,
      agentRole: e.role,
      eventType: e.type,
      sequence: i + 1,
      title: e.summary.slice(0, 64),
      content: e.summary,
      metadata: e.verification ? { verificationResult: e.verification } : undefined,
      startedAt: ts(args.startedOffsetMin + i * 0.5),
      endedAt: ts(args.startedOffsetMin + i * 0.5 + 0.4),
      createdAt: ts(args.startedOffsetMin + i * 0.5),
    })),
  }
}

export const DEMO_AGENT_SESSIONS: DemoSessionBundle[] = [
  buildBundle({
    ownerUsername: 'alice',
    sessionId: 'sess-alice-js1',
    title: '诊断 my-train-job 为什么排队',
    startedOffsetMin: -240,
    endedOffsetMin: -235,
    userMessage: '我的 my-train-job 为什么还没运行？',
    assistantMessage:
      '队列 gpu-l40s 已满载（16/16）且有 12 个作业排队；2 张 L40S 维护中。建议切换到 gpu-3090 队列，或等待约 35 分钟。',
    tools: [
      {
        name: 'query_queue_status',
        args: { queue: 'gpu-l40s' },
        result: { used: 16, capacity: 16, pending: 12 },
        role: 'explorer',
      },
      {
        name: 'query_user_quota',
        args: { account: 'nlp-lab' },
        result: { gpuUsed: 6, gpuLimit: 8 },
        role: 'explorer',
      },
      {
        name: 'query_cluster_capacity',
        args: { gpu_type: 'l40s' },
        result: { ready: 2, maintenance: 2 },
        role: 'explorer',
      },
      {
        name: 'query_recent_scheduler_events',
        args: { job: 'my-train-job' },
        result: { failed_count: 8, reasons: ['InsufficientGPU'] },
        role: 'explorer',
      },
    ],
    events: [
      { role: 'coordinator', type: 'agent_run_started', summary: '入口判断：作业状态查询任务' },
      { role: 'coordinator', type: 'agent_handoff', summary: 'handoff to planner' },
      { role: 'planner', type: 'agent_status', summary: '拆分 4 步证据收集' },
      { role: 'planner', type: 'agent_handoff', summary: 'handoff to explorer' },
      { role: 'explorer', type: 'tool_call', summary: 'query_queue_status' },
      { role: 'explorer', type: 'tool_call', summary: 'query_user_quota' },
      { role: 'explorer', type: 'tool_call', summary: 'query_cluster_capacity' },
      { role: 'explorer', type: 'tool_call', summary: 'query_recent_scheduler_events' },
      { role: 'explorer', type: 'agent_handoff', summary: 'handoff to verifier' },
      {
        role: 'verifier',
        type: 'agent_handoff',
        summary: '证据完整，结论可支撑',
        verification: 'pass',
      },
      { role: 'coordinator', type: 'final_answer', summary: '诊断完毕，给出 2 种处置建议' },
    ],
  }),
  buildBundle({
    ownerUsername: 'alice',
    sessionId: 'sess-alice-js2',
    title: '诊断 nlp-train-001 失败原因',
    startedOffsetMin: -180,
    endedOffsetMin: -174,
    userMessage: '作业 nlp-train-001 失败了，帮我看看为什么',
    assistantMessage:
      'CUDA 显存不足触发 OOM（退出码 137）。显存峰值 23.6/24G。建议把 batch size 从 64 降到 32，或将显存申请提升到 24G。',
    tools: [
      {
        name: 'get_job_detail',
        args: { name: 'nlp-train-001' },
        result: { status: 'Failed', exitCode: 137 },
        role: 'explorer',
      },
      {
        name: 'get_job_events',
        args: { name: 'nlp-train-001' },
        result: { events: ['OOMKilled', 'GPU mem peak 23.6/24'] },
        role: 'explorer',
      },
      {
        name: 'get_container_logs',
        args: { name: 'nlp-train-001', tail: 200 },
        result: { tail: 'CUDA out of memory' },
        role: 'explorer',
      },
      {
        name: 'query_job_metrics',
        args: { name: 'nlp-train-001', metrics: ['gpu_memory'] },
        result: { peak: 23.6, avg: 21.4 },
        role: 'explorer',
      },
      {
        name: 'query_similar_failures',
        args: { reason: 'OOMKilled' },
        result: { count: 3, pattern: 'batch=64 + 16G' },
        role: 'explorer',
      },
    ],
    events: [
      { role: 'coordinator', type: 'agent_run_started', summary: '入口判断：作业失败诊断任务' },
      { role: 'coordinator', type: 'agent_handoff', summary: 'handoff to planner' },
      { role: 'planner', type: 'agent_status', summary: '拆分 5 步证据' },
      { role: 'planner', type: 'agent_handoff', summary: 'handoff to explorer' },
      { role: 'explorer', type: 'tool_call', summary: 'get_job_detail' },
      { role: 'explorer', type: 'tool_call', summary: 'get_job_events' },
      { role: 'explorer', type: 'tool_call', summary: 'get_container_logs' },
      { role: 'explorer', type: 'tool_call', summary: 'query_job_metrics' },
      { role: 'explorer', type: 'tool_call', summary: 'query_similar_failures' },
      { role: 'explorer', type: 'agent_handoff', summary: 'handoff to verifier' },
      {
        role: 'verifier',
        type: 'agent_handoff',
        summary: '三重证据互证：OOMKilled / 峰值 23.6G / 历史模式',
        verification: 'pass',
      },
      { role: 'coordinator', type: 'final_answer', summary: '诊断完毕，给出 3 种方案对照' },
    ],
  }),
  buildBundle({
    ownerUsername: 'alice',
    sessionId: 'sess-alice-js3',
    title: '停止 stuck-job-7（已确认）',
    startedOffsetMin: -120,
    endedOffsetMin: -115,
    userMessage: '帮我把 stuck-job-7 停掉',
    assistantMessage: '作业 stuck-job-7 已停止，释放 4 GPU。未发现联动作业受影响。审计已记录。',
    tools: [
      {
        name: 'get_job_detail',
        args: { name: 'stuck-job-7' },
        result: { status: 'Running', gpus: 4 },
        role: 'explorer',
      },
      {
        name: 'check_job_dependents',
        args: { name: 'stuck-job-7' },
        result: { dependents: [] },
        role: 'explorer',
      },
      {
        name: 'stop_job',
        args: { name: 'stuck-job-7', grace_period_seconds: 30 },
        result: { ok: true },
        role: 'executor',
      },
      {
        name: 'get_job_detail',
        args: { name: 'stuck-job-7' },
        result: { status: 'Stopped' },
        role: 'verifier',
      },
    ],
    events: [
      {
        role: 'coordinator',
        type: 'agent_run_started',
        summary: '识别为受控执行任务（high risk）',
      },
      { role: 'coordinator', type: 'agent_handoff', summary: 'handoff to planner' },
      { role: 'planner', type: 'agent_status', summary: '安排前置检查 + 执行 + 复核' },
      { role: 'explorer', type: 'tool_call', summary: 'get_job_detail / check_job_dependents' },
      {
        role: 'executor',
        type: 'tool_call_confirmation_required',
        summary: '等待用户确认 stop_job',
      },
      { role: 'executor', type: 'tool_call', summary: 'stop_job 执行完成' },
      { role: 'verifier', type: 'tool_call', summary: 'get_job_detail 复核 Stopped 状态' },
      {
        role: 'verifier',
        type: 'agent_handoff',
        summary: '操作结果与意图一致',
        verification: 'pass',
      },
      { role: 'coordinator', type: 'final_answer', summary: '执行完成，释放 4 GPU' },
    ],
  }),
  buildBundle({
    ownerUsername: 'sysadmin',
    sessionId: 'sess-admin-ad1',
    title: '今日集群巡检',
    startedOffsetMin: -90,
    endedOffsetMin: -82,
    userMessage: '帮我巡检集群今日状况',
    assistantMessage:
      '检出 1 critical（节点异常）、1 warning（队列拥塞）、7 info（GPU 利用率偏低）。预计可回收 23.5 GPU·h。建议优先处理 gpu-node-03。',
    tools: [
      {
        name: 'get_cluster_health',
        args: {},
        result: { total: 318, failureRate: 0.085 },
        role: 'explorer',
      },
      { name: 'list_nodes', args: {}, result: { degraded: ['gpu-node-03'] }, role: 'explorer' },
      {
        name: 'query_queue_status',
        args: { all: true },
        result: { 'gpu-l40s': '16/16+12pending' },
        role: 'explorer',
      },
      {
        name: 'detect_idle_jobs',
        args: { gpu_util_threshold: 0.05, min_duration_hours: 2 },
        result: { count: 7 },
        role: 'explorer',
      },
      {
        name: 'query_recent_failures',
        args: { window_hours: 24 },
        result: { count: 27, top: 'OOM=11' },
        role: 'explorer',
      },
    ],
    events: [
      { role: 'coordinator', type: 'agent_run_started', summary: '识别为巡检流水线任务' },
      { role: 'coordinator', type: 'agent_handoff', summary: 'handoff to planner' },
      {
        role: 'planner',
        type: 'agent_status',
        summary: '5 步巡检：健康 / 节点 / 队列 / 空跑 / 失败',
      },
      { role: 'explorer', type: 'tool_call', summary: 'get_cluster_health' },
      { role: 'explorer', type: 'tool_call', summary: 'list_nodes' },
      { role: 'explorer', type: 'tool_call', summary: 'query_queue_status' },
      { role: 'explorer', type: 'tool_call', summary: 'detect_idle_jobs' },
      { role: 'explorer', type: 'tool_call', summary: 'query_recent_failures' },
      {
        role: 'verifier',
        type: 'agent_handoff',
        summary: '证据覆盖 5 个维度',
        verification: 'pass',
      },
      {
        role: 'coordinator',
        type: 'pipeline_report',
        summary: '巡检报告：3 个 category 9 个 item',
      },
      { role: 'coordinator', type: 'final_answer', summary: '巡检完毕' },
    ],
  }),
  buildBundle({
    ownerUsername: 'sysadmin',
    sessionId: 'sess-admin-ad2',
    title: '排查 gpu-node-03 异常',
    startedOffsetMin: -60,
    endedOffsetMin: -53,
    userMessage: '节点 gpu-node-03 怎么回事？最近这上面的作业都失败',
    assistantMessage:
      'gpu-node-03 出现 Xid 79 硬件故障。3 个作业被影响。建议立即 cordon 后联系运维换卡。',
    tools: [
      {
        name: 'get_node_detail',
        args: { name: 'gpu-node-03' },
        result: { ready: true, gpuHealthy: false },
        role: 'explorer',
      },
      {
        name: 'list_jobs_on_node',
        args: { node: 'gpu-node-03' },
        result: { jobs: ['cv-train-12', 'rl-train-04', 'big-job-1'] },
        role: 'explorer',
      },
      {
        name: 'get_node_events',
        args: { name: 'gpu-node-03' },
        result: { xid: 4 },
        role: 'explorer',
      },
      {
        name: 'query_prometheus',
        args: { query: 'DCGM_FI_DEV_XID_ERRORS{Hostname="gpu-node-03"}' },
        result: { count: 4 },
        role: 'explorer',
      },
    ],
    events: [
      { role: 'coordinator', type: 'agent_run_started', summary: '识别为节点诊断任务' },
      { role: 'planner', type: 'agent_status', summary: '4 步排查：详情 / 作业 / 事件 / 指标' },
      { role: 'explorer', type: 'tool_call', summary: 'get_node_detail' },
      { role: 'explorer', type: 'tool_call', summary: 'list_jobs_on_node' },
      { role: 'explorer', type: 'tool_call', summary: 'get_node_events' },
      { role: 'explorer', type: 'tool_call', summary: 'query_prometheus' },
      {
        role: 'verifier',
        type: 'agent_handoff',
        summary: '4 个独立来源互证：硬件故障',
        verification: 'pass',
      },
      { role: 'coordinator', type: 'final_answer', summary: '根因：Xid 79；建议 cordon' },
    ],
  }),
  buildBundle({
    ownerUsername: 'sysadmin',
    sessionId: 'sess-admin-ad3',
    title: '批量停止空跑作业（已确认）',
    startedOffsetMin: -30,
    endedOffsetMin: -22,
    userMessage: '把 GPU 利用率 <5% 持续 2h+ 的作业批量停掉',
    assistantMessage: '已停止 5 个空跑作业，释放 5 GPU，预计回收 17.5 GPU·h。已通知对应用户邮箱。',
    tools: [
      {
        name: 'detect_idle_jobs',
        args: { gpu_util_threshold: 0.05, min_duration_hours: 2 },
        result: { count: 7 },
        role: 'explorer',
      },
      { name: 'stop_job', args: { name: 'idle-train-01' }, result: { ok: true }, role: 'executor' },
      { name: 'stop_job', args: { name: 'idle-train-02' }, result: { ok: true }, role: 'executor' },
      { name: 'stop_job', args: { name: 'idle-train-03' }, result: { ok: true }, role: 'executor' },
      { name: 'stop_job', args: { name: 'idle-train-04' }, result: { ok: true }, role: 'executor' },
      { name: 'stop_job', args: { name: 'idle-train-05' }, result: { ok: true }, role: 'executor' },
    ],
    events: [
      {
        role: 'coordinator',
        type: 'agent_run_started',
        summary: '识别为批量受控执行任务（high risk）',
      },
      { role: 'planner', type: 'agent_status', summary: '5 步：检出 / 列表 / 确认 / 执行 / 验证' },
      { role: 'explorer', type: 'tool_call', summary: 'detect_idle_jobs' },
      { role: 'executor', type: 'batch_confirmation', summary: '7 候选 5 预选' },
      { role: 'executor', type: 'tool_call', summary: 'stop_job × 5（已确认）' },
      { role: 'verifier', type: 'agent_handoff', summary: '5/5 成功', verification: 'pass' },
      { role: 'coordinator', type: 'final_answer', summary: '回收 17.5 GPU·h' },
    ],
  }),
]

export function findSessionBundle(sessionId: string): DemoSessionBundle | undefined {
  return DEMO_AGENT_SESSIONS.find((b) => b.session.sessionId === sessionId)
}

export function sessionsForRole(role: 'user' | 'admin'): DemoSessionBundle[] {
  return DEMO_AGENT_SESSIONS.filter((b) =>
    role === 'admin' ? b.ownerUsername === 'sysadmin' : b.ownerUsername === 'alice'
  )
}
