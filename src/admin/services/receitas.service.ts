import { api } from './api'

export type Dificuldade = 'facil' | 'medio' | 'dificil'

export interface Receita {
  id: string
  title: string
  description: string
  ingredients: string
  preparation: string
  prepTime: string
  servings: number
  difficulty: Dificuldade
  tips: string
  imageUrl: string
}

export const receitasService = {
  getAll: () => api.get<Receita[]>('/receitas'),
  create: (data: Omit<Receita, 'id'>) => api.post<Receita>('/receitas', data),
  update: (id: string, data: Partial<Receita>) => api.put<Receita>(`/receitas/${id}`, data),
  delete: (id: string) => api.delete(`/receitas/${id}`),
}
