import { api } from './api'

export interface ProcedimentoHeroAPI {
  instituteName?: string
  heading1?: string
  heading2?: string
  subtitle?: string
}

export interface ProcedimentoAPI {
  id: number
  tagline: string
  titulo: string
  descricao: string
  imagem_capa: string | null
  ordem: number
  ativo: boolean
  createdAt: string
}

export interface ProcedimentoPayload {
  tagline: string
  titulo: string
  descricao: string
  imagem_capa?: string | null
  ordem?: number
  ativo?: boolean
}

export interface ProcedimentoBloco {
  id: number
  ordem: number
  tagline: string
  titulo: string
  paragraphs: string[]
  benefits: string[]
  ctaText: string
  imagem: string
}

interface ParsedDescricao {
  paragraphs: string[]
  benefits: string[]
  ctaText: string
}

export function parseDescricao(descricao: string): ParsedDescricao {
  try {
    const parsed = JSON.parse(descricao) as Partial<ParsedDescricao>
    return {
      paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [],
      benefits: Array.isArray(parsed.benefits) ? parsed.benefits : [],
      ctaText: typeof parsed.ctaText === 'string' ? parsed.ctaText : 'Agendar consulta',
    }
  } catch {
    return { paragraphs: descricao ? [descricao] : [], benefits: [], ctaText: 'Agendar consulta' }
  }
}

export function serializeDescricao(data: { paragraphs: string[]; benefits: string[]; ctaText: string }): string {
  return JSON.stringify({
    paragraphs: data.paragraphs.filter(p => p.trim()),
    benefits: data.benefits.filter(b => b.trim()),
    ctaText: data.ctaText.trim() || 'Agendar consulta',
  })
}

export function mapProcedimento(item: ProcedimentoAPI): ProcedimentoBloco {
  const { paragraphs, benefits, ctaText } = parseDescricao(item.descricao)
  return {
    id: item.id,
    ordem: item.ordem ?? 0,
    tagline: item.tagline ?? '',
    titulo: item.titulo ?? '',
    paragraphs,
    benefits,
    ctaText,
    imagem: item.imagem_capa ?? '',
  }
}

export const procedimentosService = {
  getHero: () => api.get<ProcedimentoHeroAPI>('/procedimentos-header'),
  saveHero: (data: ProcedimentoHeroAPI) => api.put<ProcedimentoHeroAPI>('/procedimentos-header', data),
  getAll: () => api.get<ProcedimentoAPI[]>('/procedimentos'),
  create: (data: ProcedimentoPayload) => api.post<ProcedimentoAPI>('/procedimentos', data),
  update: (id: number, data: Partial<ProcedimentoPayload>) => api.put<ProcedimentoAPI>(`/procedimentos/${id}`, data),
  delete: (id: number) => api.delete(`/procedimentos/${id}`),
  reorder: (ids: number[]) => api.patch('/procedimentos/reorder', { ids }),
}