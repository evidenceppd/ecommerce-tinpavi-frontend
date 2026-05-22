import { api } from './api'

export interface Noticia {
  id: string
  categoria: string
  titulo: string
  descricao: string
  materia: string
  imagemCapa: string
  imagemBanner: string
  imagemBannerMobile: string
  tempoLeitura: string
  topicos: string[]
  publicado: boolean
  createdAt: string
}

// Campos retornados pela API em snake_case
interface BlogApiItem {
  id: number | string
  categoria: string
  titulo: string
  descricao: string
  materia: string
  imagem_capa?: string | null
  imagem_banner?: string | null
  imagem_banner_mobile?: string | null
  tempo_leitura?: string | null
  topicos?: string[] | null
  publicado?: boolean
  data_publicacao?: string | null
  createdAt?: string
  created_at?: string
}

function mapBlog(item: BlogApiItem): Noticia {
  return {
    id: String(item.id),
    categoria: item.categoria ?? '',
    titulo: item.titulo ?? '',
    descricao: item.descricao ?? '',
    materia: item.materia ?? '',
    imagemCapa: item.imagem_capa ?? '',
    imagemBanner: item.imagem_banner ?? '',
    imagemBannerMobile: item.imagem_banner_mobile ?? '',
    tempoLeitura: item.tempo_leitura ?? '',
    topicos: Array.isArray(item.topicos) ? (item.topicos as string[]) : [],
    publicado: item.publicado ?? true,
    createdAt: item.createdAt ?? item.created_at ?? item.data_publicacao ?? new Date().toISOString(),
  }
}

export interface NoticiaInput {
  categoria: string
  titulo: string
  descricao: string
  materia: string
  publicado: boolean
  imagemCapa?: string
  imagemBanner?: string
  imagemBannerMobile?: string
  tempoLeitura?: string
  topicos?: string[]
}

function toApiPayload(data: Partial<NoticiaInput>) {
  const payload: Record<string, unknown> = {}

  if (data.categoria !== undefined) payload.categoria = data.categoria
  if (data.titulo !== undefined) payload.titulo = data.titulo
  if (data.descricao !== undefined) payload.descricao = data.descricao
  if (data.materia !== undefined) payload.materia = data.materia
  if (data.publicado !== undefined) payload.publicado = data.publicado
  if (data.imagemCapa !== undefined) payload.imagem_capa = data.imagemCapa
  if (data.imagemBanner !== undefined) payload.imagem_banner = data.imagemBanner
  if (data.imagemBannerMobile !== undefined) payload.imagem_banner_mobile = data.imagemBannerMobile
  if (data.tempoLeitura !== undefined) payload.tempo_leitura = data.tempoLeitura
  if (data.topicos !== undefined) payload.topicos = data.topicos
  return payload
}

export const noticiasService = {
  // Endpoint protegido (admin)
  async getAll(): Promise<Noticia[]> {
    const raw = await api.get<BlogApiItem[]>('/blogs')
    return (Array.isArray(raw) ? raw : []).map(mapBlog)
  },
  // Endpoint publico (site)
  async getPublished(perPage = 100): Promise<Noticia[]> {
    const raw = await api.get<BlogApiItem[]>(`/blogs/published?perPage=${perPage}`)
    return (Array.isArray(raw) ? raw : []).map(mapBlog)
  },
  async getById(id: string): Promise<Noticia> {
    const raw = await api.get<BlogApiItem>(`/blogs/${id}`)
    return mapBlog(raw)
  },
  async create(data: NoticiaInput): Promise<Noticia> {
    const raw = await api.post<BlogApiItem>('/blogs', toApiPayload(data))
    return mapBlog(raw)
  },
  async update(id: string, data: Partial<NoticiaInput>): Promise<Noticia> {
    const raw = await api.put<BlogApiItem>(`/blogs/${id}`, toApiPayload(data))
    return mapBlog(raw)
  },
  delete: (id: string) => api.delete(`/blogs/${id}`),
}
