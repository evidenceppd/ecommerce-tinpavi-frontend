import { describe, expect, it, vi } from 'vitest'

vi.mock('../pedido.service', () => ({
  pedidoService: {
    list: vi.fn(),
  },
}))

import { pedidoService } from '../pedido.service'
import { pagamentoService } from '../pagamento.service'

describe('pagamentoService', () => {
  it('maps orders to payment visibility table rows', async () => {
    vi.mocked(pedidoService.list).mockResolvedValueOnce({
      total: 2,
      items: [
        {
          id: 'o1',
          status: 'PAID',
          paymentStatus: 'PAID',
          total: 120,
          createdAt: '2026-01-01',
          customer: { id: 'u1', name: 'Cliente A', email: 'a@mail.com' },
        },
        {
          id: 'o2',
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          total: 80,
          createdAt: '2026-01-02',
          customer: { id: 'u2', email: 'b@mail.com' },
        },
      ],
    } as never)

    const result = await pagamentoService.list({ page: 1, limit: 20, paymentStatus: 'PAID' })

    expect(pedidoService.list).toHaveBeenCalledWith({ page: 1, limit: 20 })
    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      orderId: 'o1',
      customerName: 'Cliente A',
      paymentStatus: 'PAID',
    })
  })
})
