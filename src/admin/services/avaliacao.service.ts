import { api } from './api'

export type AvaliacaoStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Avaliacao {
  id: string
  rating: number
  comment?: string | null
  status: AvaliacaoStatus
  isVerifiedPurchase?: boolean
  productId?: string
  customerId?: string
  customer?: {
    name: string
  }
  product?: {
    title: string
  }
  createdAt: string
}

export interface AvaliacaoEligibility {
  canReview: boolean
  reason?: 'ALREADY_REVIEWED' | 'PURCHASE_REQUIRED'
}

export interface AvaliacoesProdutoResponse {
  items: Avaliacao[]
  total: number
}

export const avaliacaoService = {
  async list(params: { page?: number; limit?: number; status?: AvaliacaoStatus } = {}): Promise<{ items: Avaliacao[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    if (params.status) query.set('status', params.status)

    const response = await api.getEnvelope<Avaliacao[]>(`/admin/reviews?${query.toString()}`)
    return {
      items: response.data || [],
      total: response.meta?.total ?? 0,
    }
  },

  async moderate(id: string, payload: { status: 'APPROVED' | 'REJECTED'; moderatorNote?: string }): Promise<Avaliacao> {
    return api.patch<Avaliacao>(`/admin/reviews/${id}`, payload)
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/admin/reviews/${id}`)
  },

  async listByProduct(productId: string, params: { page?: number; limit?: number } = {}): Promise<AvaliacoesProdutoResponse> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    const response = await api.getEnvelope<AvaliacoesProdutoResponse>(`/products/${productId}/reviews?${query.toString()}`)
    return response.data || { items: [], total: 0 }
  },

  async checkEligibility(productId: string): Promise<AvaliacaoEligibility> {
    return api.get<AvaliacaoEligibility>(`/products/${productId}/reviews/eligibility`)
  },

  async createForProduct(productId: string, payload: { rating: number; comment?: string }): Promise<Avaliacao> {
    return api.post<Avaliacao>(`/products/${productId}/reviews`, payload)
  },

  async updateMine(productId: string, payload: { rating?: number; comment?: string }): Promise<Avaliacao> {
    return api.patch<Avaliacao>(`/products/${productId}/reviews/mine`, payload)
  },

  async deleteMine(productId: string): Promise<void> {
    return api.delete<void>(`/products/${productId}/reviews/mine`)
  },
}
