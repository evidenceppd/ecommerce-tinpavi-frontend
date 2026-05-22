import { api } from './api'

export interface ClienteResumo {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'CUSTOMER' | 'ADMIN' | 'MASTER'
  company?: string | null
  document?: string | null
  addressesCount?: number
  ordersCount?: number
}

export interface ClienteEndereco {
  id: string
  label?: string
  street: string
  number: string
  district: string
  city: string
  state: string
  zipCode: string
}

export interface ClientePedidoResumo {
  id: string
  status: string
  total: number
  createdAt: string
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

export interface ClienteDetalhe extends ClienteResumo {
  addresses?: ClienteEndereco[]
  orders?: ClientePedidoResumo[]
}

interface BackendClienteResumo extends Omit<ClienteResumo, 'role'> {
  role: ClienteResumo['role']
}

interface BackendClienteDetalhe extends Omit<ClienteDetalhe, 'orders'> {
  orders?: Array<{
    id: string
    status: string
    total?: number | string
    totalAmount?: number | string
    createdAt: string
    items?: Array<{
      id: string
      productId: string
      variantId?: string | null
      quantity?: number | string
      unitPrice?: number | string
      totalPrice?: number | string
      subtotal?: number | string
      variantName?: string | null
      product?: {
        title?: string
        name?: string
        code?: string
      }
      productName?: string
      productCode?: string
    }>
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

function mapClienteResumo(customer: BackendClienteResumo): ClienteResumo {
  return { ...customer }
}

function mapClienteDetalhe(customer: BackendClienteDetalhe): ClienteDetalhe {
  return {
    ...customer,
    orders: (customer.orders || []).map((order) => ({
      id: order.id,
      status: order.status,
      total: toNumber(order.total ?? order.totalAmount),
      createdAt: order.createdAt,
      items: (order.items || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
        subtotal: toNumber(item.subtotal ?? item.totalPrice),
        productName: item.productName ?? item.product?.title ?? item.product?.name,
        productCode: item.productCode ?? item.product?.code,
        variationName: formatVariationName(item.variantName),
      })),
    })),
  }
}

function formatVariationName(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed && trimmed !== '[object Object]' ? trimmed : undefined
  }
  if (typeof value === 'object') {
    const parts = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue != null && entryValue !== '')
      .map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
    return parts.length ? parts.join(' | ') : undefined
  }
  return String(value)
}

export const clienteService = {
  async list(params: { page?: number; limit?: number; search?: string; role?: 'CUSTOMER' | 'ADMIN' | 'MASTER' } = {}): Promise<{ items: ClienteResumo[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    if (params.search) query.set('search', params.search)
    if (params.role) query.set('role', params.role)

    const response = await api.getEnvelope<BackendClienteResumo[]>(`/admin/customers?${query.toString()}`)
    return {
      items: (response.data || []).map(mapClienteResumo),
      total: response.meta?.total ?? 0,
    }
  },

  async getById(id: string): Promise<ClienteDetalhe> {
    return mapClienteDetalhe(await api.get<BackendClienteDetalhe>(`/admin/customers/${id}`))
  },
}
