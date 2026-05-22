import { api } from './api'

export interface NossaEquipe {
  id: string
  nome: string
  sobrenome?: string
  cargo: string
  descricao?: string
  imageUrl: string
  ordem: number
}

export const nossaEquipeService = {
  getAll: () => api.get<NossaEquipe[]>('/nossa-equipe'),
  create: (data: Omit<NossaEquipe, 'id'>) => api.post<NossaEquipe>('/nossa-equipe', data),
  update: (id: string, data: Partial<NossaEquipe>) => api.put<NossaEquipe>(`/nossa-equipe/${id}`, data),
  delete: (id: string) => api.delete(`/nossa-equipe/${id}`),
  reorder: (ids: string[]) => api.patch('/nossa-equipe/reorder', { ids }),
}
