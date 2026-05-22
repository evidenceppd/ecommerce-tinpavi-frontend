import { api } from './api'

export interface SeoRedirect {
  id: string
  fromPath: string
  toPath: string
  isActive: boolean
}

export interface SeoRedirectPayload {
  fromPath: string
  toPath: string
  isActive?: boolean
}

export const seoRedirectService = {
  async list(params: { page?: number; limit?: number } = {}): Promise<{ items: SeoRedirect[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    const response = await api.getEnvelope<SeoRedirect[]>(`/admin/redirects?${query.toString()}`)
    return {
      items: response.data || [],
      total: response.meta?.total ?? 0,
    }
  },

  async create(payload: SeoRedirectPayload): Promise<SeoRedirect> {
    return api.post<SeoRedirect>('/admin/redirects', payload)
  },

  async update(id: string, payload: Partial<SeoRedirectPayload>): Promise<SeoRedirect> {
    return api.patch<SeoRedirect>(`/admin/redirects/${id}`, payload)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/redirects/${id}`)
  },
}
