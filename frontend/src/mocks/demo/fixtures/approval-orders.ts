import type { AgentReportData, ApprovalOrder, ReviewSource } from '@/services/api/approvalorder'

interface DemoOrderConfig {
  id: number
  name: string
  type: string
  typeID: number
  reason: string
  extensionHours: number
  status: ApprovalOrder['status']
  reviewSource: ReviewSource
  reviewNotes: string
  creator: { username: string; nickname: string }
  reviewer: { username: string; nickname: string }
  createdAt: string
  agentReport: AgentReportData | null
}

const configs: DemoOrderConfig[] = [
  {
    id: 1001,
    name: 'extension-nlp-train-001-24h',
    type: 'job_extension',
    typeID: 1,
    reason:
      '该作业为论文实验主训练，剩余 4 小时即将达到训练总步数。需要延期 24 小时以完成训练并保存检查点。已同步给课题组确认。',
    extensionHours: 24,
    status: 'Approved',
    reviewSource: 'agent_auto',
    reviewNotes: 'Agent 自动审批通过（confidence=0.92）',
    creator: { username: 'alice', nickname: 'Alice 研究员' },
    reviewer: { username: 'agent-auto-reviewer', nickname: 'Mops Agent' },
    createdAt: '2026-05-12T02:00:00Z',
    agentReport: {
      verdict: 'approve',
      confidence: 0.92,
      reason:
        '工单符合自动审批策略：作业本身在 7 天内成功率高（85%），用户 GPU 配额未超限（6/8），扩展时长 ≤ 队列允许的 48 小时上限。近 30 天该用户提交的延期请求 100% 按时完成，无滥用记录。',
      user_message:
        '你好 Alice，已为作业 nlp-train-001 延期 24 小时，新到期时间 2026-05-13 02:00。请关注检查点保存频率，避免训练中断丢失进度。',
      admin_summary:
        '低风险延期请求：账户 nlp-lab GPU 占用 6/8，剩余配额 2；该用户近 30 天 4 次延期均按时结束；当前队列 gpu-l40s 排队 12 但不影响已运行作业。无需管理员介入。',
      trace: [
        { tool: 'get_user_recent_orders', args_summary: 'user=alice, days=30' },
        { tool: 'query_user_quota', args_summary: 'account=nlp-lab' },
        { tool: 'get_job_detail', args_summary: 'name=nlp-train-001' },
        { tool: 'query_queue_status', args_summary: 'queue=gpu-l40s' },
        { tool: 'policy_check_extension', args_summary: 'hours=24, limit=48' },
      ],
    },
  },
  {
    id: 1002,
    name: 'quota-expand-nlp-lab-temp',
    type: 'quota_expansion',
    typeID: 2,
    reason:
      '课题组下周三需要进行多模型对比训练，需临时扩容 4 块 GPU（共 8 张）持续 5 天。课题组已确认有可用预算。',
    extensionHours: 120,
    status: 'Pending',
    reviewSource: 'agent_auto',
    reviewNotes: '',
    creator: { username: 'alice', nickname: 'Alice 研究员' },
    reviewer: { username: '', nickname: '' },
    createdAt: '2026-05-13T06:30:00Z',
    agentReport: {
      verdict: 'escalate',
      confidence: 0.55,
      reason:
        '虽然申请理由具体且账户历史良好，但该请求触发了三条需管理员复核的策略：1) GPU 数量翻倍（4→8）超过自动批准阈值（≤2 张）；2) 持续时长 120 小时超出自动批准上限（72 小时）；3) 下周 gpu-l40s 维护窗口与申请时段部分重叠（5-15 至 5-16 凌晨）。建议管理员评估是否调整起止时间或部分批准。',
      user_message:
        '你好 Alice，本次扩容申请已提交人工复核。我们已为你整理了申请上下文（账户配额、近期使用、维护窗口冲突），管理员将在 24 小时内反馈。',
      admin_summary:
        '中等风险，建议复核：账户 nlp-lab 当前 GPU 6/8（剩 2），申请额外 4 张，超出剩余配额。课题组历史良好（近 30 天无被驳回工单）。注意 5-15 至 5-16 凌晨 gpu-l40s 节点 03/04 维护窗口可能影响有效可用资源。',
      trace: [
        { tool: 'get_user_recent_orders', args_summary: 'user=alice, days=30' },
        { tool: 'query_user_quota', args_summary: 'account=nlp-lab' },
        { tool: 'query_account_history', args_summary: 'account=nlp-lab, days=90' },
        { tool: 'policy_check_quota_expand', args_summary: 'delta_gpu=4, hours=120' },
        { tool: 'query_maintenance_windows', args_summary: 'queue=gpu-l40s, window=7d' },
      ],
    },
  },
  {
    id: 1003,
    name: 'unlock-stuck-job-7',
    type: 'job_unlock',
    typeID: 3,
    reason: 'stuck-job-7 因配置错误锁定无法删除，请求解锁以便清理。',
    extensionHours: 0,
    status: 'Rejected',
    reviewSource: 'agent_auto',
    reviewNotes: 'Agent 拒绝：作业未被锁定，无需解锁工单',
    creator: { username: 'alice', nickname: 'Alice 研究员' },
    reviewer: { username: 'agent-auto-reviewer', nickname: 'Mops Agent' },
    createdAt: '2026-05-12T20:15:00Z',
    agentReport: {
      verdict: 'approve', // verdict 是 approve 但 policy 拒绝（说明工单本身不必要）
      confidence: 0.97,
      reason:
        '校验失败：作业 stuck-job-7 当前 locked=false, permanentLocked=false，用户可直接通过 vcjobs API 删除或停止，无需提交解锁工单。建议用户在「作业详情」页面点击「停止」即可，已通过用户消息引导。',
      user_message:
        '你好 Alice，stuck-job-7 当前未处于锁定状态。请直接在作业详情页点击「停止」或「删除」即可。本工单已自动关闭，无需进一步处理。',
      admin_summary: '工单不必要：作业未锁定。已引导用户走自助流程。',
      trace: [
        { tool: 'get_job_detail', args_summary: 'name=stuck-job-7' },
        { tool: 'check_job_lock_status', args_summary: 'name=stuck-job-7' },
      ],
    },
  },
  {
    id: 1004,
    name: 'extension-cv-train-12-12h',
    type: 'job_extension',
    typeID: 1,
    reason: 'cv-train-12 因镜像拉取慢导致前 30 分钟空跑，请求补偿延期 12 小时。',
    extensionHours: 12,
    status: 'Approved',
    reviewSource: 'admin_manual',
    reviewNotes: '已确认镜像 pull 耗时 28 分钟，符合补偿政策',
    creator: { username: 'bob', nickname: 'Bob' },
    reviewer: { username: 'sysadmin', nickname: '平台管理员' },
    createdAt: '2026-05-12T15:00:00Z',
    agentReport: {
      verdict: 'escalate',
      confidence: 0.62,
      reason:
        '案例符合补偿延期常见模式但缺乏自动证据：未在 harbor 拉取记录中检索到 28 分钟的 pull 事件。建议管理员人工核实日志后批准。',
      user_message: '已提交补偿延期申请，等待管理员核实镜像拉取记录后处理。',
      admin_summary: '需要查 Harbor 拉取日志确认 image pull 时长是否符合补偿政策（>15 分钟）。',
      trace: [
        { tool: 'get_job_detail', args_summary: 'name=cv-train-12' },
        { tool: 'query_harbor_pull_history', args_summary: 'image=pytorch-2.3:cu121, period=24h' },
        { tool: 'policy_check_compensation', args_summary: 'reason=image_slow_pull' },
      ],
    },
  },
  {
    id: 1005,
    name: 'quota-expand-rl-lab-permanent',
    type: 'quota_expansion',
    typeID: 2,
    reason: '课题组长期需求，申请将 GPU 配额从 12 提升至 16。',
    extensionHours: 0,
    status: 'Pending',
    reviewSource: 'agent_auto',
    reviewNotes: '',
    creator: { username: 'grace', nickname: 'Grace' },
    reviewer: { username: '', nickname: '' },
    createdAt: '2026-05-13T07:50:00Z',
    agentReport: {
      verdict: 'escalate',
      confidence: 0.41,
      reason:
        '永久配额扩容超出 Agent 自动审批职责范围。该决策涉及预算、群组优先级、与其它课题组的资源平衡，必须由管理员决策。Agent 已整理近 90 天 rl-lab 的实际使用率（均值 78%，峰值 92%）与失败率（4.2%）作为决策参考。',
      admin_summary:
        '决策建议：实际使用率较高（78%），符合扩容信号；但近期出现 1 次 Xid 错误（gpu-node-03 影响）导致 3 次失败，需评估是否硬件问题而非配额不足。可考虑分两阶段：先临时扩容 1 个月观察，再决定永久扩容。',
      trace: [
        { tool: 'query_account_utilization', args_summary: 'account=rl-lab, days=90' },
        { tool: 'query_account_failure_rate', args_summary: 'account=rl-lab, days=90' },
        { tool: 'policy_check_permanent_quota', args_summary: 'requires_human=true' },
      ],
    },
  },
]

export const DEMO_APPROVAL_ORDERS: ApprovalOrder[] = configs.map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  type: cfg.type,
  status: cfg.status,
  content: {
    approvalorderTypeID: cfg.typeID,
    approvalorderReason: cfg.reason,
    approvalorderExtensionHours: cfg.extensionHours,
  },
  reviewNotes: cfg.reviewNotes,
  creator: cfg.creator,
  reviewer: cfg.reviewer,
  createdAt: cfg.createdAt,
  reviewSource: cfg.reviewSource,
  agentReport: cfg.agentReport ? JSON.stringify(cfg.agentReport) : '',
}))

export function ordersForUser(username: string): ApprovalOrder[] {
  return DEMO_APPROVAL_ORDERS.filter((o) => o.creator.username === username)
}

export function findOrder(id: number): ApprovalOrder | undefined {
  return DEMO_APPROVAL_ORDERS.find((o) => o.id === id)
}
