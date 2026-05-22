import { useState, useEffect } from 'react'
import { api } from './api'

export interface BlogBannerContent {
  supertitulo: string
  titulo: string
  descricao: string
  imagem: string
}

export const BLOG_BANNER_DEFAULTS: BlogBannerContent = {
  supertitulo: 'Conteúdo técnico',
  titulo: 'Conteúdo técnico e orientações',
  descricao: 'Informações, dicas e boas práticas sobre sinalização viária para ajudar você a escolher e utilizar os produtos corretos com segurança e eficiência.',
  imagem: '',
}

let _cache: BlogBannerContent | null = null
let _promise: Promise<BlogBannerContent | null> | null = null

export const blogBannerService = {
  async getPublic(): Promise<BlogBannerContent> {
    const data = await api.get<BlogBannerContent>('/blog-banner')
    return { ...BLOG_BANNER_DEFAULTS, ...data }
  },

  update: (payload: Partial<BlogBannerContent>) =>
    api.put<BlogBannerContent>('/blog-banner', payload),
}

export function useBlogBanner(): BlogBannerContent {
  const [data, setData] = useState<BlogBannerContent>(_cache ?? BLOG_BANNER_DEFAULTS)

  useEffect(() => {
    if (_cache) { setData(_cache); return }
    if (!_promise) {
      _promise = blogBannerService.getPublic().catch(() => null)
    }
    _promise
      .then((d) => { if (d) { _cache = d; setData(d) } })
      .catch(() => {})
  }, [])

  return data
}
