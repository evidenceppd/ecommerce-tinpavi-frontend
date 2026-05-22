import { api } from './api'
import { authDB } from '../utils/db'
import { cartService } from './cart.service'

export interface CustomerAddress {
  id: string
  zipCode: string
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  state: string
  country: string
  isDefault: boolean
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  document?: string | null
  address?: string | null
  mfaEnabled?: boolean
  defaultAddress?: CustomerAddress | null
}

export interface CustomerMfaChallenge {
  mfaRequired: true
  challengeId: string
  emailMasked: string
  expiresInSeconds: number
}

type CustomerLoginResponse = { accessToken: string; refreshToken: string } | CustomerMfaChallenge

function isMfaChallenge(response: CustomerLoginResponse): response is CustomerMfaChallenge {
  return 'mfaRequired' in response && response.mfaRequired === true
}

function decodeJwtType(token: string): string | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(base64)) as { t?: string }
    return decoded.t ?? null
  } catch {
    return null
  }
}

export const customerAuthService = {
  async login(email: string, password: string): Promise<CustomerProfile | CustomerMfaChallenge> {
    const tokens = await api.post<CustomerLoginResponse>('/auth/login', { email, password })
    if (isMfaChallenge(tokens)) return tokens
    return this.completeLogin(tokens)
  },

  async verifyLoginCode(challengeId: string, code: string): Promise<CustomerProfile> {
    const tokens = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login/customer/verify', { challengeId, code })
    return this.completeLogin(tokens)
  },

  async completeLogin(tokens: { accessToken: string; refreshToken: string }): Promise<CustomerProfile> {
    await authDB.set('customer_token', tokens.accessToken)
    await authDB.set('customer_refresh_token', tokens.refreshToken)
    const profile = await api.get<CustomerProfile>('/me/profile')
    await authDB.set('customer_profile', JSON.stringify(profile))
    await cartService.syncGuestCartToServer()
    return profile
  },

  async register(name: string, email: string, password: string): Promise<CustomerProfile> {
    const tokens = await api.post<{ accessToken: string; refreshToken: string }>('/auth/register', { name, email, password })
    await authDB.set('customer_token', tokens.accessToken)
    await authDB.set('customer_refresh_token', tokens.refreshToken)
    const profile = await api.get<CustomerProfile>('/me/profile')
    await authDB.set('customer_profile', JSON.stringify(profile))
    await cartService.syncGuestCartToServer()
    return profile
  },

  async logout(): Promise<void> {
    await authDB.del('customer_token')
    await authDB.del('customer_refresh_token')
    await authDB.del('customer_profile')
    sessionStorage.removeItem('admin_usuario')
  },

  async getProfile(): Promise<CustomerProfile | null> {
    const data = await authDB.get('customer_profile')
    if (!data) return null
    try { return JSON.parse(data) as CustomerProfile } catch { return null }
  },

  async updateProfile(data: {
    name?: string
    phone?: string | null
    company?: string | null
    document?: string | null
  }): Promise<CustomerProfile> {
    const profile = await api.put<CustomerProfile>('/me/profile', data)
    await authDB.set('customer_profile', JSON.stringify(profile))
    return profile
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/me/security/password', data)
  },

  async requestMfaSetup(): Promise<{ emailMasked: string; expiresInSeconds: number }> {
    return api.post('/me/security/mfa/request', {})
  },

  async verifyMfaSetup(code: string): Promise<CustomerProfile> {
    const profile = await api.post<CustomerProfile>('/me/security/mfa/verify', { code })
    await authDB.set('customer_profile', JSON.stringify(profile))
    return profile
  },

  async disableMfa(): Promise<CustomerProfile> {
    const profile = await api.delete<CustomerProfile>('/me/security/mfa')
    await authDB.set('customer_profile', JSON.stringify(profile))
    return profile
  },

  async createAddress(data: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> {
    return api.post<CustomerAddress>('/me/addresses', data)
  },

  async updateAddress(addressId: string, data: Partial<Omit<CustomerAddress, 'id'>>): Promise<CustomerAddress> {
    return api.put<CustomerAddress>(`/me/addresses/${addressId}`, data)
  },

  async listAddresses(): Promise<CustomerAddress[]> {
    return api.get<CustomerAddress[]>('/me/addresses')
  },

  async restoreSession(): Promise<CustomerProfile | null> {
    const token = await authDB.get('customer_token')
    if (!token) return null
    if (decodeJwtType(token) !== 'CUSTOMER') return null
    const cached = await this.getProfile()
    if (cached) return cached
    try {
      const profile = await api.get<CustomerProfile>('/me/profile')
      await authDB.set('customer_profile', JSON.stringify(profile))
      return profile
    } catch {
      return null
    }
  },

  async refreshProfile(): Promise<CustomerProfile | null> {
    const token = await authDB.get('customer_token')
    if (!token) return null
    if (decodeJwtType(token) !== 'CUSTOMER') return null
    try {
      const profile = await api.get<CustomerProfile>('/me/profile')
      await authDB.set('customer_profile', JSON.stringify(profile))
      return profile
    } catch {
      return null
    }
  },
}
