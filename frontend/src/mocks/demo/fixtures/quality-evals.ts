import type { AgentQualityEval } from '@/services/api/admin/agentAudit'

import { DEMO_AGENT_SESSIONS } from './agent-sessions'

interface DemoEvalConfig {
  sessionId: string
  overallScore: number
  dimensions: Array<{ key: string; label: string; score: number; comment: string }>
}

const evalConfigs: DemoEvalConfig[] = [
  {
    sessionId: 'sess-alice-js1',
    overallScore: 4.5,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.7, comment: '紧扣排队问题，未发散' },
      { key: 'factual', label: '事实一致性', score: 4.6, comment: '队列容量、配额与工具结果一致' },
      { key: 'tool_use', label: '工具使用', score: 4.5, comment: '4 个证据工具覆盖全面' },
      { key: 'risk_control', label: '风险控制', score: 4.4, comment: '未触发写操作' },
      { key: 'usability', label: '可用性', score: 4.3, comment: '建议具体，但缺少时间估计' },
    ],
  },
  {
    sessionId: 'sess-alice-js2',
    overallScore: 4.7,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.9, comment: '直击 OOM 失败问题' },
      {
        key: 'factual',
        label: '事实一致性',
        score: 4.8,
        comment: '退出码、显存峰值与工具结果一致',
      },
      { key: 'tool_use', label: '工具使用', score: 4.7, comment: '5 个工具构成完整证据链' },
      { key: 'risk_control', label: '风险控制', score: 4.5, comment: '无写操作' },
      { key: 'usability', label: '可用性', score: 4.6, comment: '三种修复方案对比清晰' },
    ],
  },
  {
    sessionId: 'sess-alice-js3',
    overallScore: 4.6,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.6, comment: '匹配停止意图' },
      { key: 'factual', label: '事实一致性', score: 4.7, comment: '执行前后状态对照清晰' },
      { key: 'tool_use', label: '工具使用', score: 4.5, comment: '前置 + 执行 + 验证三段式合规' },
      { key: 'risk_control', label: '风险控制', score: 4.8, comment: '弹出确认卡，记录审计' },
      { key: 'usability', label: '可用性', score: 4.4, comment: '可补充释放资源的可视化' },
    ],
  },
  {
    sessionId: 'sess-admin-ad1',
    overallScore: 4.8,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.8, comment: '5 步巡检覆盖完整' },
      { key: 'factual', label: '事实一致性', score: 4.9, comment: 'pipeline 报告与工具结果对齐' },
      { key: 'tool_use', label: '工具使用', score: 4.8, comment: '健康/节点/队列/空跑/失败齐全' },
      { key: 'risk_control', label: '风险控制', score: 4.5, comment: '未触发写操作' },
      { key: 'usability', label: '可用性', score: 4.9, comment: '优先级建议明确' },
    ],
  },
  {
    sessionId: 'sess-admin-ad2',
    overallScore: 4.6,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.7, comment: '精确锁定 gpu-node-03' },
      { key: 'factual', label: '事实一致性', score: 4.8, comment: '4 个独立来源互证 Xid 79' },
      { key: 'tool_use', label: '工具使用', score: 4.6, comment: 'Prometheus 引入有效' },
      { key: 'risk_control', label: '风险控制', score: 4.5, comment: '保留 cordon 决策给管理员' },
      { key: 'usability', label: '可用性', score: 4.5, comment: '建议步骤具体' },
    ],
  },
  {
    sessionId: 'sess-admin-ad3',
    overallScore: 4.7,
    dimensions: [
      { key: 'relevance', label: '回答相关性', score: 4.6, comment: '匹配批量清理意图' },
      { key: 'factual', label: '事实一致性', score: 4.8, comment: '检出与执行一致' },
      { key: 'tool_use', label: '工具使用', score: 4.7, comment: '批量执行细粒度' },
      { key: 'risk_control', label: '风险控制', score: 4.9, comment: '批量确认卡 + 用户勾选' },
      { key: 'usability', label: '可用性', score: 4.6, comment: 'GPU·h 回收量明确' },
    ],
  },
]

type EvalShape = Pick<
  AgentQualityEval,
  'evalScope' | 'evalType' | 'triggerSource' | 'evalStatus' | 'chatModel' | 'chainModel'
>

interface EvalVariant extends EvalShape {
  idOffset: number
  /** 1.0 = baseline; other values scale overall score */
  scoreScale: number
  summaryNote: string
}

const evalVariants: EvalVariant[] = [
  {
    idOffset: 100,
    evalScope: 'session',
    evalType: 'full',
    triggerSource: 'manual',
    evalStatus: 'completed',
    chatModel: 'glm-4.6',
    chainModel: 'glm-4.6',
    scoreScale: 1.0,
    summaryNote: '会话级全维度评估（Full）：覆盖对话质量、工具链、风险控制三大类。',
  },
  {
    idOffset: 200,
    evalScope: 'session',
    evalType: 'dialogue',
    triggerSource: 'offline_batch',
    evalStatus: 'completed',
    chatModel: 'qwen-max-latest',
    chainModel: '',
    scoreScale: 1.03,
    summaryNote:
      '会话级对话质量评估（Dialogue）：关注表达清晰度、上下文一致性、可读性，离线批跑产出。',
  },
  {
    idOffset: 300,
    evalScope: 'session',
    evalType: 'task',
    triggerSource: 'feedback',
    evalStatus: 'completed',
    chatModel: '',
    chainModel: 'glm-4.6',
    scoreScale: 0.98,
    summaryNote:
      '会话级任务执行评估（Task）：关注工具链合理性、证据充分性、操作合规性，由用户反馈触发。',
  },
  {
    idOffset: 400,
    evalScope: 'turn',
    evalType: 'full',
    triggerSource: 'manual',
    evalStatus: 'completed',
    chatModel: 'glm-4.6',
    chainModel: 'glm-4.6',
    scoreScale: 0.95,
    summaryNote: '轮次级全维度评估（Turn / Full）：粒度更细，聚焦本轮入口判断与结论形成。',
  },
]

// Generate matrix of (session × variant). Skip combinations where it would be
// noisy (e.g. dialogue eval on the very-short JS-1). This gives the admin
// quality-eval list real diversity for screenshots.
export const DEMO_QUALITY_EVALS: AgentQualityEval[] = evalConfigs.flatMap((cfg, cfgIdx) =>
  evalVariants
    .filter((variant) => {
      // The fallback-style short sessions skip the dialogue eval to add diversity.
      if (cfg.sessionId === 'sess-alice-js1' && variant.evalType === 'dialogue') return false
      return true
    })
    .map((variant) => {
      const bundle = DEMO_AGENT_SESSIONS.find((b) => b.session.sessionId === cfg.sessionId)
      const overall = Number((cfg.overallScore * variant.scoreScale).toFixed(2))
      const dimensions = cfg.dimensions.map((d) => ({
        ...d,
        score: Number(Math.min(5, d.score * variant.scoreScale).toFixed(2)),
      }))
      return {
        id: variant.idOffset + cfgIdx,
        sessionId: cfg.sessionId,
        turnId: bundle?.turns[0].turnId,
        evalScope: variant.evalScope,
        evalType: variant.evalType,
        targetId:
          variant.evalScope === 'turn' ? (bundle?.turns[0].turnId ?? cfg.sessionId) : cfg.sessionId,
        feedbackId: variant.triggerSource === 'feedback' ? 1 : null,
        triggerSource: variant.triggerSource,
        evalStatus: variant.evalStatus,
        chatScores:
          variant.chatModel !== ''
            ? {
                overall,
                dimensions: Object.fromEntries(dimensions.map((d) => [d.key, d.score])),
              }
            : undefined,
        chainScores:
          variant.chainModel !== ''
            ? {
                overall: Number((overall - 0.05).toFixed(2)),
                tool_chain_quality: dimensions.find((d) => d.key === 'tool_use')?.score,
                risk_control: dimensions.find((d) => d.key === 'risk_control')?.score,
              }
            : undefined,
        chatModel: variant.chatModel,
        chainModel: variant.chainModel,
        summary:
          variant.summaryNote +
          '\n\n' +
          dimensions.map((d) => `${d.label} ${d.score.toFixed(1)}: ${d.comment}`).join('\n'),
        rawChatResp: { dimensions, overall, variantType: variant.evalType },
        rawChainResp: null,
        artifactPath: undefined,
        metadata: { dimensions, variantType: variant.evalType, variantScope: variant.evalScope },
        createdAt: bundle?.session.updatedAt ?? '2026-05-13T08:00:00Z',
        completedAt: bundle?.session.updatedAt ?? '2026-05-13T08:00:00Z',
        updatedAt: bundle?.session.updatedAt ?? '2026-05-13T08:00:00Z',
      } satisfies AgentQualityEval
    })
)

// One in-progress eval to demonstrate the "running" badge during recording.
DEMO_QUALITY_EVALS.unshift({
  id: 999,
  sessionId: 'sess-admin-ad3',
  turnId: undefined,
  evalScope: 'session',
  evalType: 'task',
  targetId: 'sess-admin-ad3',
  feedbackId: null,
  triggerSource: 'manual',
  evalStatus: 'running',
  chatScores: undefined,
  chainScores: undefined,
  chatModel: 'glm-4.6',
  chainModel: 'glm-4.6',
  summary: '评估进行中：正在分析批量停止场景的工具链合规性与风险控制流程……',
  rawChatResp: null,
  rawChainResp: null,
  artifactPath: undefined,
  metadata: { stage: 'tool_chain_analysis', progress: 0.42 },
  createdAt: new Date(Date.now() - 90_000).toISOString(),
  completedAt: null,
  updatedAt: new Date(Date.now() - 30_000).toISOString(),
})

export function evalsForSession(sessionId: string): AgentQualityEval[] {
  return DEMO_QUALITY_EVALS.filter((e) => e.sessionId === sessionId)
}
