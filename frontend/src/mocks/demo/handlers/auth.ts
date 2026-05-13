import { HttpResponse, http } from 'msw'

import type { IAuthResponse } from '@/services/api/auth'
import type { IResponse } from '@/services/types'

import {
  DEMO_ACCOUNTS,
  accessModeFor,
  findAccountByCredentials,
  findAccountByToken,
  platformRoleFor,
} from '../accounts'
import { setActiveUser } from '../session-store'

const baseURL = import.meta.env.VITE_SERVER_PROXY_BACKEND ?? ''

function userPayload(account: (typeof DEMO_ACCOUNTS)[number]): IAuthResponse {
  return {
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    context: {
      queue: account.role === 'admin' ? 'default' : 'gpu-l40s',
      roleQueue: platformRoleFor(account.role),
      rolePlatform: platformRoleFor(account.role),
      accessQueue: accessModeFor(account.role),
      accessPublic: accessModeFor(account.role),
      space: account.accountName,
    },
    user: {
      id: account.userId,
      name: account.username,
      nickname: account.nickname,
    },
    version: {
      appVersion: 'demo',
      commitSHA: 'demomode',
      buildType: 'demo',
      buildTime: '2026-05-13T00:00:00Z',
    },
  }
}

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
}

export const authHandlers = [
  // Login mode probing (called once on /auth page).
  http.get(`${baseURL}api/auth/mode`, () =>
    HttpResponse.json({
      code: 0,
      msg: '',
      data: {
        enableLdap: false,
        enableNormalLogin: true,
        enableNormalRegister: false,
      },
    })
  ),

  // Username/password login.
  http.post(`${baseURL}api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      auth?: string
      username?: string
      password?: string
      token?: string
    }
    const account = findAccountByCredentials(body.username, body.password)
    if (!account) {
      return HttpResponse.json<IResponse<null>>(
        { code: 40001, msg: '用户名或密码错误', data: null },
        { status: 401 }
      )
    }
    setActiveUser({ username: account.username, role: account.role })
    return HttpResponse.json({ code: 0, msg: '', data: userPayload(account) })
  }),

  // Boot-time token check.
  http.get(`${baseURL}api/auth/check`, ({ request }) => {
    const account = findAccountByToken(bearer(request))
    if (!account) {
      // Match real backend behavior: no token => 200 with data: undefined
      // so the AuthProvider falls back to the login page.
      return HttpResponse.json({ code: 0, msg: '', data: undefined })
    }
    return HttpResponse.json({
      code: 0,
      msg: '',
      data: {
        user: { id: account.userId, name: account.username, nickname: account.nickname },
        context: userPayload(account).context,
        version: userPayload(account).version,
      },
    })
  }),

  // Refresh token (used by the apiClient 401-retry path).
  http.post(`${baseURL}api/auth/refresh`, async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken: string }
    const account = findAccountByToken(refreshToken)
    if (!account) {
      return HttpResponse.json(
        { code: 40101, msg: 'invalid refresh token', data: null },
        { status: 401 }
      )
    }
    return HttpResponse.json({ code: 0, msg: '', data: userPayload(account) })
  }),

  // Queue/space switch (v1) — no-op for demo, just returns same payload.
  http.post(`${baseURL}api/v1/auth/switch`, ({ request }) => {
    const account = findAccountByToken(bearer(request))
    if (!account) {
      return HttpResponse.json(
        { code: 40101, msg: 'unauthorized', data: null },
        { status: 401 }
      )
    }
    return HttpResponse.json({ code: 0, msg: '', data: userPayload(account) })
  }),
]
