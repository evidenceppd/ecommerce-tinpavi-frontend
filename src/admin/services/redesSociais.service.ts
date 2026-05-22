import { api } from './api'

export interface RedeSocial {
  id: string
  linkInstagram: string
  ativoInstagram: boolean
  linkFacebook: string
  ativoFacebook: boolean
  linkWhatsapp: string
  ativoWhatsapp: boolean
}

export const redesSociaisService = {
  get: () => api.get<RedeSocial>('/redes-sociais'),
  update: (data: Partial<RedeSocial>) => api.put<RedeSocial>('/redes-sociais', data),
}
