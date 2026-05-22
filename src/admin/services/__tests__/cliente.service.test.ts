import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    getEnvelope: vi.fn(),
  },
}))

import { api } from '../api'
import { clienteService } from '../cliente.service'

describe('clienteService', () => {
  it('list requests admin customers endpoint with search', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'u1', name: 'Cliente 1', email: 'c1@mail.com', role: 'CUSTOMER' }],
      meta: { total: 1 },
    } as never)

    const result = await clienteService.list({ page: 1, limit: 20, search: 'Cliente' })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/customers?page=1&limit=20&search=Cliente')
    expect(result.total).toBe(1)
  })

  it('getById requests admin customer detail endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'u1',
      name: 'Cliente 1',
      email: 'c1@mail.com',
      role: 'CUSTOMER',
      addresses: [{ id: 'a1', street: 'Rua A', number: '10', district: 'Centro', city: 'SP', state: 'SP', zipCode: '00000-000' }],
      orders: [{ id: 'o1', status: 'PAID', total: 100, createdAt: '2026-01-01' }],
    } as never)

    const result = await clienteService.getById('u1')

    expect(api.get).toHaveBeenCalledWith('/admin/customers/u1')
    expect(result.addresses?.length).toBe(1)
    expect(result.orders?.[0]?.id).toBe('o1')
  })
})
