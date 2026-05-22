import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    getEnvelope: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../api'
import { avaliacaoService } from '../avaliacao.service'

describe('avaliacaoService', () => {
  it('list requests moderation queue by status', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'r1', rating: 5, status: 'PENDING', createdAt: '2026-01-01' }],
      meta: { total: 1 },
    } as never)

    const result = await avaliacaoService.list({ page: 1, limit: 20, status: 'PENDING' })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/reviews?page=1&limit=20&status=PENDING')
    expect(result.total).toBe(1)
  })

  it('moderate sends approve/reject payload to backend', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ id: 'r1', rating: 5, status: 'APPROVED', createdAt: '2026-01-01' } as never)

    const result = await avaliacaoService.moderate('r1', { status: 'APPROVED', moderatorNote: 'ok' })

    expect(api.patch).toHaveBeenCalledWith('/admin/reviews/r1', { status: 'APPROVED', moderatorNote: 'ok' })
    expect(result.status).toBe('APPROVED')
  })

  it('remove deletes review through admin API', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce(undefined as never)

    await avaliacaoService.remove('r1')

    expect(api.delete).toHaveBeenCalledWith('/admin/reviews/r1')
  })

  it('lists public product reviews through API', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: { items: [{ id: 'r1', rating: 5, status: 'APPROVED', createdAt: '2026-01-01' }], total: 1 },
    } as never)

    const result = await avaliacaoService.listByProduct('prod-1', { page: 2, limit: 10 })

    expect(api.getEnvelope).toHaveBeenCalledWith('/products/prod-1/reviews?page=2&limit=10')
    expect(result.total).toBe(1)
  })

  it('checks customer review eligibility through API', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ canReview: false, reason: 'PURCHASE_REQUIRED' } as never)

    const result = await avaliacaoService.checkEligibility('prod-1')

    expect(api.get).toHaveBeenCalledWith('/products/prod-1/reviews/eligibility')
    expect(result.reason).toBe('PURCHASE_REQUIRED')
  })

  it('creates, updates and deletes customer review through product API', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'r1', rating: 5, status: 'PENDING', createdAt: '2026-01-01' } as never)
    vi.mocked(api.patch).mockResolvedValueOnce({ id: 'r1', rating: 4, status: 'PENDING', createdAt: '2026-01-01' } as never)
    vi.mocked(api.delete).mockResolvedValueOnce(undefined as never)

    await avaliacaoService.createForProduct('prod-1', { rating: 5, comment: 'Bom' })
    await avaliacaoService.updateMine('prod-1', { rating: 4 })
    await avaliacaoService.deleteMine('prod-1')

    expect(api.post).toHaveBeenCalledWith('/products/prod-1/reviews', { rating: 5, comment: 'Bom' })
    expect(api.patch).toHaveBeenCalledWith('/products/prod-1/reviews/mine', { rating: 4 })
    expect(api.delete).toHaveBeenCalledWith('/products/prod-1/reviews/mine')
  })
})
