import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    getEnvelope: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from '../api'
import { cupomService } from '../cupom.service'

describe('cupomService', () => {
  it('list returns paginated coupons from admin endpoint', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'cp1', code: 'PROMO10', type: 'PERCENTAGE', value: 10, validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true }],
      meta: { total: 1 },
    } as never)

    const result = await cupomService.list({ page: 1, limit: 10, isActive: true })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/coupons?page=1&limit=10&isActive=true')
    expect(result.items[0]?.code).toBe('PROMO10')
    expect(result.total).toBe(1)
  })

  it('update sends patch to admin coupon endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ id: 'cp1', code: 'PROMO10', type: 'PERCENTAGE', value: 12, validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true } as never)

    const result = await cupomService.update('cp1', { value: 12 })

    expect(api.patch).toHaveBeenCalledWith('/admin/coupons/cp1', { value: 12 })
    expect(result.value).toBe(12)
  })
})
