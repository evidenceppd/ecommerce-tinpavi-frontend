import { api } from './api'

export interface Newsletter {
  id: string
  email: string
  nome?: string
  createdAt: string
}

export const newsletterService = {
  getAll: () => api.get<Newsletter[]>('/newsletter'),
  delete: (id: string) => api.delete(`/newsletter/${id}`),
}
