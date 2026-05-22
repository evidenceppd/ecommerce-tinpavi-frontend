import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const mockAuthDB = vi.hoisted(() => ({
  get: vi.fn<[(
    | 'admin_token'
    | 'admin_refresh_token'
    | 'admin_usuario'
    | 'customer_profile'
    | 'customer_token'
    | 'customer_refresh_token')], Promise<string | null>>(),
  set: vi.fn<[string, string], Promise<void>>(),
  del: vi.fn<[string], Promise<void>>(),
  clear: vi.fn<[], Promise<void>>(),
}))

vi.mock('../../utils/db', () => ({
  authDB: mockAuthDB,
}))

type FetchMock = ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

function getFetchMock(): FetchMock {
  return globalThis.fetch as unknown as FetchMock
}

function buildToken(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${encoded}.signature`
}

function buildUserToken(expOffsetSeconds = 3600) {
  return buildToken({
    sub: 'user-1',
    role: 'ADMIN',
    t: 'USER',
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
  })
}

function buildCustomerToken(expOffsetSeconds = 3600) {
  return buildToken({
    sub: 'customer-1',
    role: 'CUSTOMER',
    t: 'CUSTOMER',
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
  })
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function loadApi() {
  const module = await import('../api')
  return module.api
}

describe('api auth routing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    if (originalFetch) {
      vi.stubGlobal('fetch', originalFetch)
      return
    }
    Reflect.deleteProperty(globalThis, 'fetch')
  })

  it('uses customer_token on /me endpoints even when admin_token exists', async () => {
    const adminToken = buildUserToken()
    const customerToken = buildCustomerToken()

    mockAuthDB.get.mockImplementation(async (key) => {
      if (key === 'customer_token') return customerToken
      if (key === 'admin_token') return adminToken
      return null
    })

    getFetchMock().mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: { id: 'customer-1' },
      }),
    )

    const api = await loadApi()
    await api.get('/me/profile')

    expect(mockAuthDB.get).toHaveBeenCalledWith('customer_token')
    expect(mockAuthDB.get).not.toHaveBeenCalledWith('admin_token')

    const [, init] = getFetchMock().mock.calls[0] as [string, RequestInit]
    const authHeader = (init.headers as Headers).get('Authorization')
    expect(authHeader).toBe(`Bearer ${customerToken}`)
  })

  it('keeps admin endpoints bound to admin_token', async () => {
    const adminToken = buildUserToken()

    mockAuthDB.get.mockImplementation(async (key) => {
      if (key === 'admin_token') return adminToken
      return null
    })

    getFetchMock().mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: [],
      }),
    )

    const api = await loadApi()
    await api.get('/admin/products')

    expect(mockAuthDB.get).toHaveBeenCalledWith('admin_token')
    expect(mockAuthDB.get).not.toHaveBeenCalledWith('customer_token')

    const [, init] = getFetchMock().mock.calls[0] as [string, RequestInit]
    const authHeader = (init.headers as Headers).get('Authorization')
    expect(authHeader).toBe(`Bearer ${adminToken}`)
  })

  it('refreshes customer token (not admin) after 401 on /me/profile and retries', async () => {
    let customerToken = buildCustomerToken()
    const refreshedCustomerToken = buildCustomerToken(7200)

    mockAuthDB.get.mockImplementation(async (key) => {
      if (key === 'customer_token') return customerToken
      if (key === 'customer_refresh_token') return 'customer-refresh-token'
      if (key === 'admin_refresh_token') return 'admin-refresh-token'
      if (key === 'admin_token') return buildUserToken()
      return null
    })

    mockAuthDB.set.mockImplementation(async (key, value) => {
      if (key === 'customer_token') {
        customerToken = value
      }
    })

    getFetchMock()
      .mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: {
            accessToken: refreshedCustomerToken,
            refreshToken: 'customer-refresh-token-2',
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: { id: 'customer-1', email: 'cliente@site.com' },
        }),
      )

    const api = await loadApi()
    const profile = await api.get<{ id: string; email: string }>('/me/profile')

    expect(profile.id).toBe('customer-1')
    expect(getFetchMock()).toHaveBeenCalledTimes(3)

    const [refreshUrl, refreshInit] = getFetchMock().mock.calls[1] as [string, RequestInit]
    expect(refreshUrl).toContain('/auth/refresh')
    expect(JSON.parse(String(refreshInit.body))).toMatchObject({
      refreshToken: 'customer-refresh-token',
    })

    expect(mockAuthDB.set).toHaveBeenCalledWith('customer_token', refreshedCustomerToken)
    expect(mockAuthDB.set).toHaveBeenCalledWith('customer_refresh_token', 'customer-refresh-token-2')
    expect(mockAuthDB.set).not.toHaveBeenCalledWith('admin_token', expect.any(String))
  })
})
