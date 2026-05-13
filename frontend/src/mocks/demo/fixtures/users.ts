export interface DemoUser {
  id: number
  name: string
  nickname: string
  accountId: number
  accountName: string
  role: 'user' | 'admin'
  email: string
  group?: string
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 1001,
    name: 'alice',
    nickname: 'Alice 研究员',
    accountId: 2001,
    accountName: 'nlp-lab',
    role: 'user',
    email: 'alice@example.edu',
    group: 'NLP 组',
  },
  {
    id: 1,
    name: 'sysadmin',
    nickname: '平台管理员',
    accountId: 1,
    accountName: 'platform',
    role: 'admin',
    email: 'admin@example.edu',
  },
  {
    id: 1002,
    name: 'bob',
    nickname: 'Bob',
    accountId: 2002,
    accountName: 'cv-lab',
    role: 'user',
    email: 'bob@example.edu',
    group: 'CV 组',
  },
  {
    id: 1003,
    name: 'carol',
    nickname: 'Carol',
    accountId: 2002,
    accountName: 'cv-lab',
    role: 'user',
    email: 'carol@example.edu',
    group: 'CV 组',
  },
  {
    id: 1004,
    name: 'dave',
    nickname: 'Dave',
    accountId: 2003,
    accountName: 'rec-lab',
    role: 'user',
    email: 'dave@example.edu',
    group: '推荐组',
  },
  {
    id: 1005,
    name: 'eve',
    nickname: 'Eve',
    accountId: 2003,
    accountName: 'rec-lab',
    role: 'user',
    email: 'eve@example.edu',
    group: '推荐组',
  },
  {
    id: 1006,
    name: 'frank',
    nickname: 'Frank',
    accountId: 2001,
    accountName: 'nlp-lab',
    role: 'user',
    email: 'frank@example.edu',
    group: 'NLP 组',
  },
  {
    id: 1007,
    name: 'grace',
    nickname: 'Grace',
    accountId: 2004,
    accountName: 'rl-lab',
    role: 'user',
    email: 'grace@example.edu',
    group: 'RL 组',
  },
  {
    id: 1008,
    name: 'henry',
    nickname: 'Henry',
    accountId: 2004,
    accountName: 'rl-lab',
    role: 'user',
    email: 'henry@example.edu',
    group: 'RL 组',
  },
]

export function findUser(name: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.name === name)
}
