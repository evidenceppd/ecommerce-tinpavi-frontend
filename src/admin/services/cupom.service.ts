import { api } from './api'

export type CupomTipo = 'PERCENTAGE' | 'FIXED'

export interface Cupom {
  id: string
  code: string
  type: CupomTipo
  value: number
  validFrom: string
  validUntil: string
  maxUses?: number | null
  maxUsesPerCustomer?: number | null
  isActive: boolean
}

export interface CupomPayload {
  code: string
  type: CupomTipo
  value: number
  validFrom: string
  validUntil: string
  maxUses?: number
  maxUsesPerCustomer?: number
  isActive?: boolean
}

export const cupomService = {
  async list(params: { page?: number; limit?: number; isActive?: boolean } = {}): Promise<{ items: Cupom[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    if (typeof params.isActive === 'boolean') query.set('isActive', String(params.isActive))

    const response = await api.getEnvelope<Cupom[]>(`/admin/coupons?${query.toString()}`)
    return {
      items: response.data || [],
      total: response.meta?.total ?? 0,
    }
  },

  async create(payload: CupomPayload): Promise<Cupom> {
    return api.post<Cupom>('/admin/coupons', payload)
  },

  async update(id: string, payload: Partial<CupomPayload>): Promise<Cupom> {
    return api.patch<Cupom>(`/admin/coupons/${id}`, payload)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/coupons/${id}`)
  },
}
