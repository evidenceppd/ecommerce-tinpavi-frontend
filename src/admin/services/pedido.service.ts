import { api } from './api'

export type PedidoStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

export interface Pedido {
  id: string
  status: PedidoStatus
  paymentStatus?: string
  total: number
  shippingCost?: number
  createdAt: string
  customerId?: string
  customer?: {
    id: string
    name?: string
    email?: string
  }
  items?: Array<{
    id: string
    productId: string
    variantId?: string | null
    quantity: number
    unitPrice: number
    subtotal: number
    productName?: string
    productCode?: string
    variationName?: string
  }>
}

interface BackendPedido {
  id: string
  status: PedidoStatus
  paymentStatus?: string
  total?: number | string
  totalAmount?: number | string
  shippingCost?: number | string
  createdAt: string
  customerId?: string
  customer?: {
    id: string
    name?: string
    email?: string
  }
  items?: Array<{
    id: string
    productId: string
    variantId?: string | null
    quantity: number
    unitPrice: number | string
    totalPrice?: number | string
    subtotal?: number | string
    productName?: string
    product?: {
      id?: string
      title?: string
      name?: string
      code?: string
    }
    productCode?: string
    variantName?: string | null
  }>
}

export interface PedidoDetalhe extends Pedido {
  shippingAddressSnapshot?: {
    street?: string
    number?: string
    district?: string
    city?: string
    state?: string
    zipCode?: string
  }
  couponSnapshot?: {
    code?: string
    discountType?: string
    discountValue?: number
  }
  statusHistory?: Array<{
    status: string
    changedAt: string
    changedBy?: string
  }>
}

interface BackendPedidoDetalhe extends BackendPedido {
  shippingStreet?: string
  shippingNumber?: string
  shippingNeighborhood?: string
  shippingCity?: string
  shippingState?: string
  shippingZipCode?: string
  couponCode?: string | null
  discountAmount?: number | string
  statusHistory?: Array<{
    status: string
    changedAt: string
    changedBy?: string
  }>
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatVariationName(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '[object Object]') return undefined
    try {
      return formatVariationName(JSON.parse(trimmed))
    } catch {
      return trimmed
    }
  }
  if (Array.isArray(value)) {
    const parts = value.map(formatVariationName).filter(Boolean)
    return parts.length ? parts.join(' · ') : undefined
  }
  if (typeof value === 'object') {
    const parts = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => {
        if (entryValue == null || entryValue === '') return null
        if (typeof entryValue === 'object') {
          const nested = formatVariationName(entryValue)
          return nested ? `${key}: ${nested}` : null
        }
        return `${key}: ${String(entryValue)}`
      })
      .filter(Boolean)
    return parts.length ? parts.join(' · ') : undefined
  }
  return String(value)
}

function mapPedido(order: BackendPedido): Pedido {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: toNumber(order.total ?? order.totalAmount),
    shippingCost: toNumber(order.shippingCost),
    createdAt: order.createdAt,
    customerId: order.customerId,
    customer: order.customer,
    items: (order.items || []).map(mapPedidoItem),
  }
}

function mapPedidoItem(item: NonNullable<BackendPedido['items']>[number]) {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: toNumber(item.unitPrice),
    subtotal: toNumber(item.subtotal ?? item.totalPrice),
    productName: item.productName ?? item.product?.title ?? item.product?.name,
    productCode: item.productCode ?? item.product?.code,
    variantId: item.variantId,
    variationName: formatVariationName(item.variantName),
  }
}

function mapPedidoDetalhe(order: BackendPedidoDetalhe): PedidoDetalhe {
  return {
    ...mapPedido(order),
    shippingAddressSnapshot: {
      street: order.shippingStreet,
      number: order.shippingNumber,
      district: order.shippingNeighborhood,
      city: order.shippingCity,
      state: order.shippingState,
      zipCode: order.shippingZipCode,
    },
    couponSnapshot: order.couponCode
      ? { code: order.couponCode, discountValue: toNumber(order.discountAmount) }
      : undefined,
    statusHistory: order.statusHistory,
  }
}

export const pedidoService = {
  async list(params: { page?: number; limit?: number; status?: PedidoStatus; search?: string } = {}): Promise<{ items: Pedido[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    if (params.status) query.set('status', params.status)
    if (params.search) query.set('search', params.search)

    const response = await api.getEnvelope<BackendPedido[]>(`/admin/orders?${query.toString()}`)
    const items = (response.data || []).map(mapPedido)
    return {
      items,
      total: response.meta?.total ?? items.length,
    }
  },

  async getById(id: string): Promise<PedidoDetalhe> {
    return mapPedidoDetalhe(await api.get<BackendPedidoDetalhe>(`/admin/orders/${id}`))
  },

  async updateStatus(id: string, status: PedidoStatus): Promise<PedidoDetalhe> {
    return mapPedidoDetalhe(await api.patch<BackendPedidoDetalhe>(`/admin/orders/${id}/status`, { status }))
  },
}
