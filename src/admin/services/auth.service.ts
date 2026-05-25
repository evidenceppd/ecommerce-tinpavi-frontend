import { api } from './api'
import { authDB } from '../utils/db'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'MASTER' | 'EDITOR'
  first_login?: boolean
}

export interface LoginResponse {
  token: string
  refreshToken: string
  usuario: Usuario
}

interface LoginApiResponse {
  accessToken?: string
  refreshToken?: string
  token?: string
  usuario?: Usuario
  user?: Partial<Usuario> & { name?: string; firstLogin?: boolean }
  message?: string
  mfaRequired?: boolean
  challengeId?: string
  emailMasked?: string
  expiresInSeconds?: number
}

interface JwtPayload {
  sub?: string
  role?: string
}

function normalizeRole(role?: string): Usuario['role'] {
  const normalized = (role || '').toUpperCase()
  if (normalized === 'MASTER') return 'MASTER'
  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'CUSTOMER') return 'CUSTOMER'
  return 'EDITOR'
}

function normalizeUser(raw?: Partial<Usuario> & { role?: string; first_login?: boolean; firstLogin?: boolean; name?: string }): Usuario {
  return {
    id: String(raw?.id || ''),
    nome: raw?.nome || raw?.name || '',
    email: raw?.email || '',
    role: normalizeRole(raw?.role),
    first_login: raw?.first_login ?? raw?.firstLogin ?? false,
  }
}

function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split('.')
  if (!payload) return {}

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return {}
  }
}

export const authService = {
  getUsuario(): Usuario | null {
    const data = sessionStorage.getItem('admin_usuario')
    if (!data) return null
    try { return JSON.parse(data) as Usuario } catch { return null }
  },
  async getToken(): Promise<string | null> {
    return authDB.get('admin_token')
  },
  async getRefreshToken(): Promise<string | null> {
    return authDB.get('admin_refresh_token')
  },
  async isAuthenticated(): Promise<boolean> {
    const token = await authDB.get('admin_token')
    if (!token) return false
    try {
      const [, payload] = token.split('.')
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { t?: string }
      if (decoded.t !== 'USER') {
        await authDB.del('admin_token')
        return false
      }
    } catch {
      return false
    }
    return true
  },
  async setSession(response: LoginResponse): Promise<void> {
    sessionStorage.setItem('admin_usuario', JSON.stringify(response.usuario))

    await authDB.set('admin_token', response.token)
    if (response.refreshToken) {
      await authDB.set('admin_refresh_token', response.refreshToken)
    }
  },
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post<LoginApiResponse>('/auth/login', { email, password: senha })

    if (response.mfaRequired) {
      if (!response.challengeId) {
        throw { response: { data: { error: 'Resposta de login invalida' } } }
      }
      return authService.verifyAdminMfa(response.challengeId)
    }

    const token = response.accessToken || response.token
    if (!token || !response.refreshToken) {
      throw { response: { data: { error: 'Resposta de login invalida' } } }
    }

    const payload = decodeJwtPayload(token)
    const mappedUser = normalizeUser(response.usuario || response.user)
    const usuario: Usuario = {
      ...mappedUser,
      id: payload.sub || mappedUser.id,
      role: normalizeRole(payload.role || mappedUser.role),
      nome: mappedUser.nome || 'Administrador',
      email: mappedUser.email || email,
    }
    const session: LoginResponse = { token, refreshToken: response.refreshToken, usuario }
    await authService.setSession(session)
    return session
  },
  async verifyAdminMfa(challengeId: string): Promise<LoginResponse> {
    const response = await api.post<LoginApiResponse>('/auth/login/admin/verify', { challengeId, code: '000000' })
    const token = response.accessToken || response.token
    if (!token || !response.refreshToken) {
      throw { response: { data: { error: 'Resposta de login invalida' } } }
    }

    const payload = decodeJwtPayload(token)
    const mappedUser = normalizeUser(response.usuario || response.user)
    const usuario: Usuario = {
      ...mappedUser,
      id: payload.sub || mappedUser.id,
      role: normalizeRole(payload.role || mappedUser.role),
      nome: mappedUser.nome || 'Administrador',
      email: mappedUser.email,
    }
    const session: LoginResponse = { token, refreshToken: response.refreshToken, usuario }
    await authService.setSession(session)
    return session
  },
  async logout(): Promise<void> {
    await authDB.clear()
    sessionStorage.removeItem('admin_usuario')
  },
}
