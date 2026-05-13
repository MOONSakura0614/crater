import type {
  AgentAuditSessionListItem,
  AgentAuditSessionListResult,
  AgentAuditSessionSummary,
} from '@/services/api/admin/agentAudit'

import { DEMO_AGENT_SESSIONS } from './agent-sessions'

function nicknameFor(username: string): string {
  if (username === 'alice') return 'Alice 研究员'
  if (username === 'sysadmin') return '平台管理员'
  return username
}

function accountFor(username: string): { id: number; name: string } {
  if (username === 'alice') return { id: 2001, name: 'nlp-lab' }
  if (username === 'sysadmin') return { id: 1, name: 'platform' }
  return { id: 0, name: '' }
}

function userIdFor(username: string): number {
  return username === 'alice' ? 1001 : 1
}

function listItemFor(
  b: (typeof DEMO_AGENT_SESSIONS)[number],
  idx: number
): AgentAuditSessionListItem {
  const account = accountFor(b.ownerUsername)
  return {
    sessionId: b.session.sessionId,
    title: b.session.title,
    source: b.session.source ?? 'chat',
    userId: userIdFor(b.ownerUsername),
    username: b.ownerUsername,
    nickname: nicknameFor(b.ownerUsername),
    accountId: account.id,
    accountName: account.name,
    accountNickname: account.name,
    messageCount: b.messages.length,
    toolCallCount: b.toolCalls.length,
    turnCount: b.turns.length,
    lastOrchestrationMode: 'multi_agent',
    orchestrationModes: ['multi_agent'],
    pinnedAt: b.session.pinnedAt ?? null,
    latestEvalId: 100 + idx,
    latestEvalScope: 'session',
    latestEvalType: 'full',
    latestEvalStatus: 'completed',
    latestEvalCompletedAt: b.session.updatedAt,
    feedbackRating: b.ownerUsername === 'alice' ? 1 : null,
    hasFeedback: b.ownerUsername === 'alice',
    createdAt: b.session.createdAt,
    updatedAt: b.session.updatedAt,
  }
}

export function demoAuditSessionsResult(): AgentAuditSessionListResult {
  const items = DEMO_AGENT_SESSIONS.map((b, i) => listItemFor(b, i))
  const summary: AgentAuditSessionSummary = {
    chat: items.filter((i) => i.source === 'chat').length,
    opsAudit: items.filter((i) => i.source === 'ops_audit').length,
    system: items.filter((i) => i.source === 'system').length,
    benchmark: items.filter((i) => i.source === 'benchmark').length,
    total: items.length,
  }
  return { items, total: items.length, summary }
}

export function demoAuditDetail(sessionId: string): AgentAuditSessionListItem | null {
  const idx = DEMO_AGENT_SESSIONS.findIndex((b) => b.session.sessionId === sessionId)
  if (idx < 0) return null
  return listItemFor(DEMO_AGENT_SESSIONS[idx], idx)
}
