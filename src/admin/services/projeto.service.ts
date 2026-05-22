import { api } from './api'

export interface ProjetoImagemAPI {
  url: string
  subImagens?: string[]
}

export interface ProjetoAPI {
  id: number
  titulo: string
  subtitulo: string | null
  descricao: string
  imagem_capa: string | null
  imagens: Array<string | ProjetoImagemAPI>
  publicado: boolean
  destaque: boolean
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export interface ProjetoPayload {
  titulo: string
  subtitulo?: string | null
  descricao: string
  imagem_capa?: string | null
  imagens?: Array<string | ProjetoImagemAPI>
  publicado?: boolean
  destaque?: boolean
  ordem?: number
}

function isHttp404(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404)
}

export const projetoService = {
  // Admin
  getAll: () => api.get<ProjetoAPI[]>('/projetos?perPage=100'),
  create: (payload: ProjetoPayload) => api.post<ProjetoAPI>('/projetos', payload),
  update: (id: number, payload: Partial<ProjetoPayload>) =>
    api.put<ProjetoAPI>(`/projetos/${id}`, payload),
  delete: (id: number) => api.delete(`/projetos/${id}`),

  // Público
  async getPublished(): Promise<ProjetoAPI[]> {
    const data = await api.get<ProjetoAPI[]>('/projetos/published?perPage=100')
    return Array.isArray(data) ? data : []
  },

  async getById(id: number): Promise<ProjetoAPI | null> {
    try {
      return await api.get<ProjetoAPI>(`/projetos/${id}`)
    } catch (error) {
      if (isHttp404(error)) return null
      throw error
    }
  },
}
