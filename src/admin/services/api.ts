import { authDB } from '../utils/db'

export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export const BACKEND_ORIGIN = new URL(BACKEND_URL).origin

export interface ApiEnvelope<T> {
  success?: boolean
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    [key: string]: unknown
  }
  error?: null | string | {
    code?: string
    message?: string
    [key: string]: unknown
  }
}

async function clearAdminSession() {
  await authDB.del('admin_token')
  await authDB.del('admin_refresh_token')
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('admin_usuario')
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired', { detail: { scope: 'admin' } }))
  }
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`
}

function buildUrl(endpoint: string): string {
  return `${BACKEND_URL}${normalizeEndpoint(endpoint)}`
}

function extractEnvelopeError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as Record<string, unknown>
  const error = data.error
  const message = data.message

  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (typeof err.message === 'string' && err.message.trim()) return err.message
    if (typeof err.code === 'string' && err.code.trim()) return err.code
  }
  if (typeof message === 'string' && message.trim()) return message
  return null
}

function buildErrorData(status: number, payload: unknown): { error: string; status: number; data: unknown } {
  const apiError = extractEnvelopeError(payload)
  if (apiError) return { error: apiError, status, data: payload }
  if (status === 401) return { error: 'Nao autorizado', status, data: payload }
  if (status === 403) return { error: 'Acesso negado', status, data: payload }
  if (status === 404) return { error: 'Recurso nao encontrado', status, data: payload }
  if (status === 409) return { error: 'Registro em conflito com outro existente', status, data: payload }
  if (status === 422) return { error: 'Dados invalidos. Verifique o preenchimento dos campos.', status, data: payload }
  if (status === 429) return { error: 'Muitas requisicoes. Tente novamente em instantes.', status, data: payload }
  return { error: 'Erro inesperado ao comunicar com a API', status, data: payload }
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function tryRefreshAccessToken(isAdmin: boolean): Promise<boolean> {
  const refreshToken = isAdmin
    ? await authDB.get('admin_refresh_token')
    : await authDB.get('customer_refresh_token')
  if (!refreshToken) return false

  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false
    const payload = unwrapEnvelope<{ accessToken?: string; token?: string; refreshToken?: string }>(await parseResponse(response))
    const token = payload?.accessToken || payload?.token
    if (!token) return false

    if (isAdmin) {
      await authDB.set('admin_token', token)
      if (payload.refreshToken) await authDB.set('admin_refresh_token', payload.refreshToken)
    } else {
      await authDB.set('customer_token', token)
      if (payload.refreshToken) await authDB.set('customer_refresh_token', payload.refreshToken)
    }
    return true
  } catch {
    return false
  }
}

async function clearCustomerSession() {
  await authDB.del('customer_token')
  await authDB.del('customer_refresh_token')
  await authDB.del('customer_profile')
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired', { detail: { scope: 'customer' } }))
  }
}

type JwtPayload = {
  t?: string
  exp?: number
}

let adminRefreshInFlight: Promise<boolean> | null = null
let customerRefreshInFlight: Promise<boolean> | null = null

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload
  } catch {
    return null
  }
}

function decodeTokenType(token: string): string | null {
  return decodeJwtPayload(token)?.t ?? null
}

function isTokenExpiring(token: string, leewaySeconds = 60): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now() + leewaySeconds * 1000
}

function shouldUseAdminToken(method: string, endpoint: string): boolean {
  const normalized = normalizeEndpoint(endpoint)
  if (normalized.startsWith('/admin/')) return true
  if (normalized.startsWith('/analytics/')) return true
  if (normalized === '/users' || normalized.startsWith('/users/')) return true
  if (normalized === '/uploads/image') return true
  if (normalized === '/contato' && method !== 'GET') return true
  if (normalized === '/hero' && method !== 'GET') return true
  if (normalized === '/blog-banner' && method !== 'GET') return true
  if (normalized === '/blogs') return true
  if (normalized.startsWith('/blogs/') && method !== 'GET') return true
  return false
}

function shouldUseCustomerToken(method: string, endpoint: string): boolean {
  const normalized = normalizeEndpoint(endpoint)
  const isCustomerReviewRoute =
    normalized.startsWith('/products/') &&
    normalized.includes('/reviews') &&
    (method !== 'GET' || !normalized.endsWith('/reviews'))

  return normalized === '/orders' || normalized.startsWith('/orders/') || normalized.startsWith('/me/') || isCustomerReviewRoute
}

async function refreshAccessTokenOnce(isAdmin: boolean): Promise<boolean> {
  if (isAdmin) {
    adminRefreshInFlight ??= tryRefreshAccessToken(true).finally(() => {
      adminRefreshInFlight = null
    })
    return adminRefreshInFlight
  }

  customerRefreshInFlight ??= tryRefreshAccessToken(false).finally(() => {
    customerRefreshInFlight = null
  })
  return customerRefreshInFlight
}

async function request<T>(method: string, endpoint: string, body?: unknown, retry = true, unwrap = true): Promise<T> {
  const wantsAdminToken = shouldUseAdminToken(method, endpoint)
  const wantsCustomerToken = !wantsAdminToken && shouldUseCustomerToken(method, endpoint)
  let token: string | null = null
  let authScope: 'admin' | 'customer' | null = null

  if (wantsAdminToken) {
    authScope = 'admin'
    const storedAdminToken = await authDB.get('admin_token')
    token = storedAdminToken && decodeTokenType(storedAdminToken) === 'USER' ? storedAdminToken : null

    // If admin_token held a non-admin token, clean only admin session state.
    if (storedAdminToken && !token) {
      await clearAdminSession()
    }

    if (token && isTokenExpiring(token)) {
      const refreshed = await refreshAccessTokenOnce(true)
      token = refreshed ? await authDB.get('admin_token') : token
    }
  } else if (wantsCustomerToken) {
    authScope = 'customer'
    token = await authDB.get('customer_token')
    if (token && isTokenExpiring(token)) {
      const refreshed = await refreshAccessTokenOnce(false)
      token = refreshed ? await authDB.get('customer_token') : token
    }
  }
  const headers = new Headers()

  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(buildUrl(endpoint), {
    method,
    headers,
    cache: wantsAdminToken ? 'no-store' : 'default',
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await parseResponse(response)

  if (response.status === 401 && retry && authScope) {
    const refreshed = await refreshAccessTokenOnce(authScope === 'admin')
    if (refreshed) {
      return request<T>(method, endpoint, body, false, unwrap)
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (authScope === 'admin') await clearAdminSession()
      else if (authScope === 'customer') await clearCustomerSession()
    }
    const errorData = buildErrorData(response.status, payload)
    throw { response: { status: response.status, data: errorData } }
  }

  return (unwrap ? unwrapEnvelope<T>(payload) : payload) as T
}

export function resolveImageUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('blob:')) return path

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      if (/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)) {
        return `${BACKEND_ORIGIN}${url.pathname}${url.search}${url.hash}`
      }
      return path
    } catch {
      return path
    }
  }

  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${BACKEND_ORIGIN}${normalized}`
  }

  if (path.startsWith('/')) return path
  return `${BACKEND_ORIGIN}/${path}`
}

export const api = {
  get: <T>(ep: string): Promise<T> => request<T>('GET', ep),
  post: <T>(ep: string, body: unknown): Promise<T> => request<T>('POST', ep, body),
  put: <T>(ep: string, body: unknown): Promise<T> => request<T>('PUT', ep, body),
  patch: <T>(ep: string, body?: unknown): Promise<T> => request<T>('PATCH', ep, body),
  delete: <T = void>(ep: string): Promise<T> => request<T>('DELETE', ep),
  getEnvelope: <T>(ep: string): Promise<ApiEnvelope<T>> => request<ApiEnvelope<T>>('GET', ep, undefined, true, false),
}
