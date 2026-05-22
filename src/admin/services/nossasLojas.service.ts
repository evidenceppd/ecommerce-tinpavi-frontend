import { api } from './api'

export interface Loja {
  id: string
  nome: string
  endereco: string
  telefone: string
  horario: string
  imageUrl: string
  latitude?: number
  longitude?: number
  ordem: number
  departamentos?: { id: number; nome: string; fotos: string[] }[]
}

export const nossasLojasService = {
  getAll: () => api.get<Loja[]>('/nossas-lojas'),
  create: (data: Omit<Loja, 'id'>) => api.post<Loja>('/nossas-lojas', data),
  update: (id: string, data: Partial<Loja>) => api.put<Loja>(`/nossas-lojas/${id}`, data),
  delete: (id: string) => api.delete(`/nossas-lojas/${id}`),
  reorder: (ids: string[]) => api.patch('/nossas-lojas/reorder', { ids }),
}
