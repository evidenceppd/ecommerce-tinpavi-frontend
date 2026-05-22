import { api } from './api'

export interface Acao {
  id: string
  categoria: string
  titulo: string
  descricao: string
  imageUrl: string
}

export const acoesService = {
  getAll: () => api.get<Acao[]>('/acoes'),
  create: (data: Omit<Acao, 'id'>) => api.post<Acao>('/acoes', data),
  update: (id: string, data: Partial<Acao>) => api.put<Acao>(`/acoes/${id}`, data),
  delete: (id: string) => api.delete(`/acoes/${id}`),
}
