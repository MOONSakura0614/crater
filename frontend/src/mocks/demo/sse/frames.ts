import type {
  AgentConfirmationForm,
  AgentSSEEvent,
  BatchConfirmationPayload,
  PipelineReportPayload,
} from '@/services/api/agent'

export type Frame = { event: AgentSSEEvent['event']; data: unknown }

export const f = {
  runStarted: (turnId: string, agentRole = 'coordinator'): Frame => ({
    event: 'agent_run_started',
    data: { turnId, agentRole, agentId: `${agentRole}-agent-1`, status: 'running' },
  }),
  status: (agentRole: string, summary: string, status = 'running'): Frame => ({
    event: 'agent_status',
    data: { agentRole, agentId: `${agentRole}-agent-1`, summary, status },
  }),
  handoff: (
    fromRole: string,
    targetRole: string,
    summary: string,
    verificationResult?: 'pass' | 'risk' | 'missing_evidence'
  ): Frame => ({
    event: 'agent_handoff',
    data: {
      agentRole: fromRole,
      agentId: `${fromRole}-agent-1`,
      targetAgentRole: targetRole,
      summary,
      status: 'completed',
      ...(verificationResult ? { verificationResult } : {}),
    },
  }),
  thinking: (content: string, agentRole = 'coordinator'): Frame => ({
    event: 'thinking',
    data: { content, agentRole },
  }),
  toolStart: (
    toolName: string,
    toolArgs: Record<string, unknown>,
    toolCallId: string,
    agentRole = 'explorer'
  ): Frame => ({
    event: 'tool_call_started',
    data: { toolName, toolArgs, toolCallId, agentRole },
  }),
  toolDone: (
    toolName: string,
    toolCallId: string,
    resultSummary: string,
    extra: Record<string, unknown> = {}
  ): Frame => ({
    event: 'tool_call_completed',
    data: { toolName, toolCallId, resultSummary, isError: false, ...extra },
  }),
  confirmation: (
    confirmId: string,
    toolCallId: string,
    description: string,
    form: AgentConfirmationForm
  ): Frame => ({
    event: 'tool_call_confirmation_required',
    data: { confirmId, toolCallId, description, form, agentRole: 'executor' },
  }),
  pipelineReport: (payload: PipelineReportPayload): Frame => ({
    event: 'pipeline_report',
    data: payload,
  }),
  batchConfirmation: (payload: BatchConfirmationPayload, confirmId: string): Frame => ({
    event: 'batch_confirmation',
    data: { ...payload, confirmId },
  }),
  finalAnswer: (content: string, sessionId?: string): Frame => ({
    event: 'final_answer',
    data: { content, agentRole: 'coordinator', ...(sessionId ? { sessionId } : {}) },
  }),
  done: (): Frame => ({ event: 'done', data: {} }),
}
