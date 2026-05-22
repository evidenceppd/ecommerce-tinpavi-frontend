import { api } from './api'

export interface MensagemFinalContent {
  id: number
  titulo_1: string
  titulo_2: string
  description: string
  imagem_capa?: string | null
}

export interface MensagemFinalPayload {
  titulo_1: string
  titulo_2: string
  description: string
  imagem_capa?: string | null
}

function isHttpError(error: unknown): error is { response?: { status?: number } } {
  return Boolean(error && typeof error === 'object' && 'response' in error)
}

export const mensagemFinalService = {
  async getPublic(): Promise<MensagemFinalContent | null> {
    try {
      return await api.get<MensagemFinalContent>('/mensagem-final')
    } catch (error) {
      if (isHttpError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  update: (payload: MensagemFinalPayload) => api.put<MensagemFinalContent>('/mensagem-final', payload),
}
