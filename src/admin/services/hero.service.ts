import { useState, useEffect } from 'react'
import { api } from './api'

export interface HeroBannerContent {
  titulo_1: string
  titulo_2: string
  titulo_3: string
  subtitulo: string
  cta_1: string
  cta_2: string
  imagem: string
}

export const HERO_DEFAULTS: HeroBannerContent = {
  titulo_1: 'ESPECIALISTAS EM',
  titulo_2: 'SINALIZAÇÃO VIÁRIA',
  titulo_3: 'PARA TODO O BRASIL',
  subtitulo: 'Produtos técnicos de alta qualidade para obras, empresas, condomínios e infraestrutura urbana.',
  cta_1: 'Ver produtos',
  cta_2: 'Falar com especialista',
  imagem: '',
}

let _cache: HeroBannerContent | null = null
let _promise: Promise<HeroBannerContent | null> | null = null

export const heroService = {
  async getPublic(): Promise<HeroBannerContent> {
    const data = await api.get<HeroBannerContent>('/hero')
    return { ...HERO_DEFAULTS, ...data }
  },

  update: (payload: Partial<HeroBannerContent>) =>
    api.put<HeroBannerContent>('/hero', payload),
}

export function useHeroBanner(): HeroBannerContent {
  const [data, setData] = useState<HeroBannerContent>(_cache ?? HERO_DEFAULTS)

  useEffect(() => {
    if (_cache) { setData(_cache); return }
    if (!_promise) {
      _promise = heroService.getPublic().catch(() => null)
    }
    _promise
      .then((d) => { if (d) { _cache = d; setData(d) } })
      .catch(() => {})
  }, [])

  return data
}
