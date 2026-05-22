import { api } from './api'

export interface NossoValor {
  id: string
  titulo: string
  descricao: string
  cor: string
  icone: string
  posicao: number
}

export const nossoValorService = {
  getAll: () => api.get<NossoValor[]>('/nosso-valor'),
  create: (data: Omit<NossoValor, 'id'>) => api.post<NossoValor>('/nosso-valor', data),
  update: (id: string, data: Partial<NossoValor>) => api.put<NossoValor>(`/nosso-valor/${id}`, data),
  delete: (id: string) => api.delete(`/nosso-valor/${id}`),
  reorder: (ids: string[]) => api.patch('/nosso-valor/reorder', { ids }),
}
