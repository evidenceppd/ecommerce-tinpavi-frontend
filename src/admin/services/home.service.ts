import { api } from './api'

export interface HomeContent {
  id: number
  titulo_1: string
  titulo_2: string | null
  subtitulo: string | null
  texto_botao: string | null
  imagem: string | null
}

export interface HomePayload {
  titulo_1: string
  titulo_2?: string | null
  subtitulo?: string | null
  texto_botao?: string | null
  imagem?: string | null
}

function isHttpError(error: unknown): error is { response?: { status?: number } } {
  return Boolean(error && typeof error === 'object' && 'response' in error)
}

export const homeService = {
  async getPublic(): Promise<HomeContent | null> {
    try {
      return await api.get<HomeContent>('/home')
    } catch (error) {
      if (isHttpError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  update: (payload: HomePayload) => api.put<HomeContent>('/home', payload),
}
