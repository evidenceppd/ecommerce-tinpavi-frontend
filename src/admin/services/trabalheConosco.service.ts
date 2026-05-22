import { api } from './api'

export interface TrabalheConosco {
  id: string
  nome: string
  email: string
  telefone: string
  cargo: string
  mensagem: string
  curriculoUrl?: string
  createdAt: string
}

export const trabalheConoscoService = {
  getAll: () => api.get<TrabalheConosco[]>('/trabalhe-conosco'),
  delete: (id: string) => api.delete(`/trabalhe-conosco/${id}`),
}
