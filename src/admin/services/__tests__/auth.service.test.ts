import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuthDB = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
}))

const sessionStorageMock = vi.hoisted(() => ({
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

vi.stubGlobal('sessionStorage', sessionStorageMock)

vi.mock('../api', () => ({
  BACKEND_URL: 'http://localhost:3000',
  api: {
    post: vi.fn(),
  },
}))

vi.mock('../../utils/db', () => ({
  authDB: mockAuthDB,
}))

import { api } from '../api'
import { authService } from '../auth.service'

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.getItem.mockReturnValue(null)
  })

  it('login stores jwt session from backend contract', async () => {
    const payload = {
      sub: 'u-1',
      role: 'ADMIN',
    }
    const token = `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`

    vi.mocked(api.post).mockResolvedValueOnce({
      accessToken: token,
      refreshToken: 'refresh-1',
      user: { id: 'u-1', nome: 'Admin', email: 'admin@site.com', role: 'ADMIN' },
    } as never)

    const result = await authService.login('admin@site.com', '123')

    expect(result.token).toBe(token)
    expect(result.refreshToken).toBe('refresh-1')
    expect(result.usuario.role).toBe('ADMIN')
    expect(mockAuthDB.set).toHaveBeenCalledWith('admin_token', token)
    expect(mockAuthDB.set).toHaveBeenCalledWith('admin_refresh_token', 'refresh-1')
  })

  it('rejects legacy admin MFA challenge because /admin login must return tokens directly', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      mfaRequired: true,
      challengeId: 'challenge-1',
      emailMasked: 'ad***@site.com',
      expiresInSeconds: 300,
    } as never)

    await expect(authService.login('admin@site.com', '123')).rejects.toMatchObject({
      response: { data: { error: expect.stringContaining('backend ainda esta exigindo MFA') } },
    })

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(mockAuthDB.set).not.toHaveBeenCalled()
  })
})
