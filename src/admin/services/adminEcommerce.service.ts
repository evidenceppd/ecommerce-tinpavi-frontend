import { api } from './api'

export interface DashboardOverview {
  totalOrders: number
  totalRevenue: number
  pendingPayments: number
  pendingReviews: number
  totalReviews: number
  lowStockProducts: number
  totalCustomers: number
  recentOrders: DashboardRecentOrder[]
  pendingReviewQueue: DashboardPendingReview[]
  analytics: DashboardAnalytics
}

export interface DashboardProductMetric {
  id: string
  title: string
  code: string
  count: number
}

export interface DashboardAnalytics {
  mostVisitedProducts: DashboardProductMetric[]
  bestSellingProducts: DashboardProductMetric[]
  abandonedCartsCount: number
}

export interface SalesReportItem {
  date: string
  orders: number
  revenue: number
}

export interface LowStockItem {
  id: string
  name: string
  sku?: string
  stock: number
  isActive: boolean
}

export interface DashboardRecentOrder {
  id: string
  status: string
  total: number
  createdAt: string
  customerName: string
  items: DashboardRecentOrderItem[]
}

export interface DashboardRecentOrderItem {
  quantity: number
  productName: string
  productCode?: string
}

export interface DashboardPendingReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  customerName: string
  productName: string
}

export interface SalesReportMeta {
  totals?: {
    totalOrders?: number
    totalRevenue?: number
  }
}

export interface PaginatedMeta {
  total?: number
  page?: number
  limit?: number
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

type BackendDashboardOverview = {
  metrics?: {
    totalRevenue?: number | string
    totalOrders?: number | string
    pendingPaymentOrders?: number | string
    totalCustomers?: number | string
    pendingReviews?: number | string
    totalReviews?: number | string
    lowStockCount?: number | string
  }
  recentOrders?: Array<{
    id: string
    status?: string
    totalAmount?: number | string
    total?: number | string
    createdAt?: string
    items?: Array<{
      quantity?: number | string
      product?: {
        title?: string
        name?: string
        code?: string
      }
    }>
    customer?: {
      name?: string
      email?: string
    }
  }>
  pendingReviewQueue?: Array<{
    id: string
    rating?: number | string
    comment?: string | null
    createdAt?: string
    customer?: {
      name?: string
      email?: string
    }
    product?: {
      title?: string
      name?: string
    }
  }>
  analytics?: {
    mostVisitedProducts?: Array<{ id?: string; title?: string; code?: string; count?: number | string }>
    bestSellingProducts?: Array<{ id?: string; title?: string; code?: string; count?: number | string }>
    abandonedCartsCount?: number | string
  }
}

type BackendSalesReportItem = {
  period?: string
  date?: string
  ordersCount?: number | string
  orders?: number | string
  revenue?: number | string
}

type BackendLowStockItem = {
  id: string
  title?: string
  name?: string
  code?: string
  sku?: string
  quantity_stock?: number
  stock?: number
}

export const adminEcommerceService = {
  async getDashboard(params: { queuePreviewLimit?: number; dateFrom?: string; dateTo?: string } = {}): Promise<DashboardOverview> {
    const query = new URLSearchParams({ queuePreviewLimit: String(params.queuePreviewLimit ?? 5) })
    if (params.dateFrom) query.set('dateFrom', params.dateFrom)
    if (params.dateTo) query.set('dateTo', params.dateTo)
    const data = await api.get<BackendDashboardOverview>(`/admin/dashboard?${query.toString()}`)
    const metrics = data.metrics || {}

    return {
      totalOrders: toNumber(metrics.totalOrders),
      totalRevenue: toNumber(metrics.totalRevenue),
      pendingPayments: toNumber(metrics.pendingPaymentOrders),
      pendingReviews: toNumber(metrics.pendingReviews),
      totalReviews: toNumber(metrics.totalReviews),
      lowStockProducts: toNumber(metrics.lowStockCount),
      totalCustomers: toNumber(metrics.totalCustomers),
      analytics: {
        mostVisitedProducts: (data.analytics?.mostVisitedProducts || []).map((item) => ({
          id: item.id || item.code || item.title || '',
          title: item.title || 'Produto',
          code: item.code || '',
          count: toNumber(item.count),
        })),
        bestSellingProducts: (data.analytics?.bestSellingProducts || []).map((item) => ({
          id: item.id || item.code || item.title || '',
          title: item.title || 'Produto',
          code: item.code || '',
          count: toNumber(item.count),
        })),
        abandonedCartsCount: toNumber(data.analytics?.abandonedCartsCount),
      },
      recentOrders: (data.recentOrders || []).map((order) => ({
        id: order.id,
        status: order.status || '',
        total: toNumber(order.total ?? order.totalAmount),
        createdAt: order.createdAt || '',
        customerName: order.customer?.name || order.customer?.email || 'Cliente',
        items: (order.items || []).map((item) => ({
          quantity: toNumber(item.quantity),
          productName: item.product?.title || item.product?.name || 'Produto',
          productCode: item.product?.code,
        })),
      })),
      pendingReviewQueue: (data.pendingReviewQueue || []).map((review) => ({
        id: review.id,
        rating: toNumber(review.rating),
        comment: review.comment ?? null,
        createdAt: review.createdAt || '',
        customerName: review.customer?.name || review.customer?.email || 'Cliente',
        productName: review.product?.title || review.product?.name || 'Produto',
      })),
    }
  },

  async getSalesReport(params: { dateFrom: string; dateTo: string }): Promise<{ items: SalesReportItem[]; meta: SalesReportMeta }> {
    const query = new URLSearchParams({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      granularity: 'day',
    })

    const response = await api.getEnvelope<BackendSalesReportItem[]>(`/admin/reports/sales?${query.toString()}`)
    return {
      items: (response.data || []).map((item) => ({
        date: item.date || item.period || '',
        orders: toNumber(item.orders ?? item.ordersCount),
        revenue: toNumber(item.revenue),
      })),
      meta: (response.meta || {}) as SalesReportMeta,
    }
  },

  async getLowStock(params: { threshold?: number; page?: number; limit?: number } = {}): Promise<{ items: LowStockItem[]; meta: PaginatedMeta }> {
    const query = new URLSearchParams({
      threshold: String(params.threshold ?? 5),
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    const response = await api.getEnvelope<BackendLowStockItem[]>(`/admin/reports/low-stock?${query.toString()}`)
    return {
      items: (response.data || []).map((item) => ({
        id: item.id,
        name: item.name || item.title || '',
        sku: item.sku || item.code,
        stock: toNumber(item.stock ?? item.quantity_stock),
        isActive: true,
      })),
      meta: (response.meta || {}) as PaginatedMeta,
    }
  },
}
