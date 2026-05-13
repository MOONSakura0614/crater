import { AccessMode, Role } from '@/services/api/auth'

export type DemoRole = 'user' | 'admin'

export interface DemoAccount {
  username: string
  password: string
  nickname: string
  role: DemoRole
  userId: number
  accountId: number
  accountName: string
  accessToken: string
  refreshToken: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'alice',
    password: 'alice123',
    nickname: 'Alice 研究员',
    role: 'user',
    userId: 1001,
    accountId: 2001,
    accountName: 'nlp-lab',
    accessToken: 'demo-token-alice',
    refreshToken: 'demo-refresh-alice',
  },
  {
    username: 'sysadmin',
    password: 'sysadmin123',
    nickname: '平台管理员',
    role: 'admin',
    userId: 1,
    accountId: 1,
    accountName: 'platform',
    accessToken: 'demo-token-sysadmin',
    refreshToken: 'demo-refresh-sysadmin',
  },
]

export function findAccountByCredentials(
  username: string | undefined,
  password: string | undefined
): DemoAccount | undefined {
  if (!username || !password) return undefined
  return DEMO_ACCOUNTS.find((a) => a.username === username && a.password === password)
}

export function findAccountByToken(token: string | null | undefined): DemoAccount | undefined {
  if (!token) return undefined
  return DEMO_ACCOUNTS.find((a) => a.accessToken === token || a.refreshToken === token)
}

export function platformRoleFor(role: DemoRole): Role {
  return role === 'admin' ? Role.Admin : Role.User
}

export function accessModeFor(role: DemoRole): AccessMode {
  return role === 'admin' ? AccessMode.ReadWrite : AccessMode.ReadOnly
}
