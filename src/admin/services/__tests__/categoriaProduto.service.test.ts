import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    getEnvelope: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../api'
import { categoriaProdutoService } from '../categoriaProduto.service'

describe('categoriaProdutoService', () => {
  it('list requests admin categories with pagination and search', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'c1', title: 'Pisos', coverImage: null }],
      meta: { total: 1 },
    } as never)

    const result = await categoriaProdutoService.list({ page: 1, limit: 30, search: 'pisos' })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/categories?page=1&limit=30&search=pisos')
    expect(result.total).toBe(1)
    expect(result.items[0]?.name).toBe('Pisos')
  })

  it('create sends hierarchical payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'c2', title: 'Porcelanato', coverImage: null } as never)

    const result = await categoriaProdutoService.create({ name: 'Porcelanato', parentId: 'c1' })

    expect(api.post).toHaveBeenCalledWith('/admin/categories', { title: 'Porcelanato' })
    expect(result.id).toBe('c2')
    expect(result.name).toBe('Porcelanato')
  })
})
