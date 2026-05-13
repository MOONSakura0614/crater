import { DEMO_PENDING_CONFIRMS_KEY, DEMO_USERS_STORAGE_KEY } from './env'

export interface PendingConfirmRecord {
  scenarioId: string
  payload: unknown // scenario-specific state needed to continue
  createdAt: number
}

export interface ActiveUserRecord {
  username: string
  role: 'user' | 'admin'
}

function readLocal<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getActiveUser(): ActiveUserRecord | null {
  return readLocal<ActiveUserRecord>(DEMO_USERS_STORAGE_KEY)
}

export function setActiveUser(record: ActiveUserRecord | null): void {
  if (!record) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(DEMO_USERS_STORAGE_KEY)
    return
  }
  writeLocal(DEMO_USERS_STORAGE_KEY, record)
}

export function setPendingConfirm(confirmId: string, record: PendingConfirmRecord): void {
  const map = readLocal<Record<string, PendingConfirmRecord>>(DEMO_PENDING_CONFIRMS_KEY) ?? {}
  map[confirmId] = record
  writeLocal(DEMO_PENDING_CONFIRMS_KEY, map)
}

export function takePendingConfirm(confirmId: string): PendingConfirmRecord | null {
  const map = readLocal<Record<string, PendingConfirmRecord>>(DEMO_PENDING_CONFIRMS_KEY) ?? {}
  const record = map[confirmId]
  if (!record) return null
  delete map[confirmId]
  writeLocal(DEMO_PENDING_CONFIRMS_KEY, map)
  return record
}
