import { api } from './api'

export interface AboutUsContent {
  id: number
  descricao: string
  imagem_capa: string
}

export interface AboutUsPayload {
  descricao: string
  imagem_capa: string
}

const defaults: AboutUsPayload = {
  descricao: '',
  imagem_capa: '',
}

function isHttpError(error: unknown): error is { response?: { status?: number } } {
  return Boolean(error && typeof error === 'object' && 'response' in error)
}

export const aboutUsService = {
  async getPublic(): Promise<AboutUsContent | null> {
    try {
      return await api.get<AboutUsContent>('/about-us')
    } catch (error) {
      if (isHttpError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  update(payload: AboutUsPayload): Promise<AboutUsContent> {
    return api.put<AboutUsContent>('/about-us', {
      ...defaults,
      ...payload,
    })
  },
}
