import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '../api'
import { adminEcommerceService } from '../adminEcommerce.service'

describe('adminEcommerceService', () => {
  it('getDashboard maps numeric metrics from /admin/dashboard', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      metrics: {
        totalOrders: 20,
        totalRevenue: 1250,
        pendingPaymentOrders: 3,
        pendingReviews: 4,
        totalReviews: 6,
        lowStockCount: 2,
        totalCustomers: 8,
      },
      analytics: {
        mostVisitedProducts: [{ id: 'p-1', title: 'Produto visitado', code: 'ABC123', count: '9' }],
        bestSellingProducts: [{ id: 'p-2', title: 'Produto vendido', code: 'DEF456', count: 4 }],
        abandonedCartsCount: '2',
      },
    } as never)

    const result = await adminEcommerceService.getDashboard(5)

    expect(api.get).toHaveBeenCalledWith('/admin/dashboard?queuePreviewLimit=5')
    expect(result).toEqual({
      totalOrders: 20,
      totalRevenue: 1250,
      pendingPayments: 3,
      pendingReviews: 4,
      totalReviews: 6,
      lowStockProducts: 2,
      totalCustomers: 8,
      recentOrders: [],
      pendingReviewQueue: [],
      analytics: {
        mostVisitedProducts: [{ id: 'p-1', title: 'Produto visitado', code: 'ABC123', count: 9 }],
        bestSellingProducts: [{ id: 'p-2', title: 'Produto vendido', code: 'DEF456', count: 4 }],
        abandonedCartsCount: 2,
      },
    })
  })
})
