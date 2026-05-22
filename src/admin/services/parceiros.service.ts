import { api } from './api'

export interface Parceiro {
  id: string
  nome: string
  logo: string
  link?: string | null
  posicao: number
}

export const parceirosService = {
  getAll: () => api.get<Parceiro[]>('/parceiros'),
  create: (data: Omit<Parceiro, 'id'>) => api.post<Parceiro>('/parceiros', data),
  update: (id: string, data: Partial<Parceiro>) => api.put<Parceiro>(`/parceiros/${id}`, data),
  delete: (id: string) => api.delete(`/parceiros/${id}`),
  reorder: (ids: string[]) => api.patch('/parceiros/reorder', { ids }),
}
