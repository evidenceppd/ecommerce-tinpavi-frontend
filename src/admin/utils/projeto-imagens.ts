import type { ProjetoImagemAPI } from '../services/projeto.service'

export interface ProjetoImagemGrupo {
  url: string
  subImagens: string[]
}

/**
 * Normalizes the `imagens` field from the API (which may be plain URL strings
 * or objects with { url, subImagens }) into a consistent ProjetoImagemGrupo[].
 */
export function normalizeProjetoImagens(
  imagens: Array<string | ProjetoImagemAPI> | undefined | null,
): ProjetoImagemGrupo[] {
  if (!imagens || imagens.length === 0) return []

  return imagens.map((item) => {
    if (typeof item === 'string') {
      return { url: item, subImagens: [] }
    }
    return {
      url: item.url,
      subImagens: Array.isArray(item.subImagens) ? item.subImagens : [],
    }
  })
}
