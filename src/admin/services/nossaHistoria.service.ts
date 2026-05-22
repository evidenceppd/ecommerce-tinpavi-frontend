import { api } from './api'

export interface NossaHistoria {
  id: string
  titulo: string
  texto: string
  imageUrl: string
  ordem: number
  cor: string
}

export const nossaHistoriaService = {
  getAll: () => api.get<NossaHistoria[]>('/nossa-historia'),
  create: (data: Omit<NossaHistoria, 'id'>) => api.post<NossaHistoria>('/nossa-historia', data),
  update: (id: string, data: Partial<NossaHistoria>) => api.put<NossaHistoria>(`/nossa-historia/${id}`, data),
  delete: (id: string) => api.delete(`/nossa-historia/${id}`),
  reorder: (ids: string[]) => api.patch('/nossa-historia/reorder', { ids }),
}
