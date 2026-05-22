import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    getEnvelope: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from '../api'
import { pedidoService } from '../pedido.service'

describe('pedidoService', () => {
  it('list returns paginated orders from /admin/orders', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'o1', status: 'PENDING_PAYMENT', total: 100, createdAt: '2026-01-01' }],
      meta: { total: 1 },
    } as never)

    const result = await pedidoService.list({ page: 1, limit: 20, status: 'PENDING_PAYMENT', search: 'joao' })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/orders?page=1&limit=20&status=PENDING_PAYMENT&search=joao')
    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe('o1')
  })

  it('updateStatus sends patch with status payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ id: 'o1', status: 'PAID', total: 100, createdAt: '2026-01-01' } as never)

    const result = await pedidoService.updateStatus('o1', 'PAID')

    expect(api.patch).toHaveBeenCalledWith('/admin/orders/o1/status', { status: 'PAID' })
    expect(result.status).toBe('PAID')
  })

  it('maps order item product details from admin order detail', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'o1',
      status: 'PENDING_PAYMENT',
      totalAmount: 224.7,
      createdAt: '2026-01-01',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 3,
          unitPrice: '74.90',
          totalPrice: '224.70',
          product: {
            title: 'Cone refletivo',
            code: 'CON123',
          },
        },
      ],
    } as never)

    const result = await pedidoService.getById('o1')

    expect(api.get).toHaveBeenCalledWith('/admin/orders/o1')
    expect(result.items?.[0]).toMatchObject({
      productId: 'prod-1',
      productName: 'Cone refletivo',
      productCode: 'CON123',
      quantity: 3,
      subtotal: 224.7,
    })
  })
})
