import { api } from './api'

export interface Campanha {
  id: string
  titulo: string
  descricao: string
  regulamento: string
  imageUrl: string
  ativa: boolean
  passos: { id: number; titulo: string; descricao: string }[]
  premios: { id: number; posicao: string; cor: string; nome: string; subtitulo: string; valor: string }[]
}

export const campanhasService = {
  getAll: () => api.get<Campanha[]>('/campanhas'),
  create: (data: Omit<Campanha, 'id'>) => api.post<Campanha>('/campanhas', data),
  update: (id: string, data: Partial<Campanha>) => api.put<Campanha>(`/campanhas/${id}`, data),
  delete: (id: string) => api.delete(`/campanhas/${id}`),
}
