import { api } from './api'
import { type Pedido, type PedidoDetalhe } from './pedido.service'
import { produtoService, type Produto } from './produto.service'

type CustomerOrderItemResponse = {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  unitPrice?: number | string
  totalPrice?: number | string
  subtotal?: number | string
  productName?: string
  productCode?: string
  variantName?: string | null
  product?: {
    title?: string
    name?: string
    code?: string
    variants?: Array<{ id?: string; attributes?: unknown }>
  }
}

type CustomerOrderResponse = Omit<Pedido, 'total' | 'items'> & {
  total?: number | string
  totalAmount?: number | string
  shippingCost?: number | string
  items?: CustomerOrderItemResponse[]
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

function mapCustomerOrder(order: CustomerOrderResponse): Pedido {
  return {
    ...order,
    total: toNumber(order.total ?? order.totalAmount),
    shippingCost: toNumber(order.shippingCost),
    items: (order.items || []).map((item) => {
      const productVariants = item.product?.variants || []
      const variantAttributes = item.variantId
        ? productVariants.find((variant) => variant.id === item.variantId)?.attributes
        : productVariants.length === 1
          ? productVariants[0]?.attributes
          : undefined

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        subtotal: toNumber(item.subtotal ?? item.totalPrice),
        productName: item.productName ?? item.product?.title ?? item.product?.name,
        productCode: item.productCode ?? item.product?.code,
        variationName: formatVariationName(item.variantName) ?? formatVariationName(variantAttributes),
      }
    }),
  }
}

async function enrichOrderVariations(orders: Pedido[]): Promise<Pedido[]> {
  const productCache = new Map<string, Promise<Produto>>()

  const getProduct = (code: string) => {
    if (!productCache.has(code)) {
      productCache.set(code, produtoService.getPublicByCode(code))
    }
    return productCache.get(code)!
  }

  await Promise.all(
    orders.flatMap((order) =>
      (order.items || []).map(async (item) => {
        if (item.variationName || !item.variantId || !item.productCode) return

        try {
          const product = await getProduct(item.productCode)
          const variant = (product.variants || []).find((candidate) => candidate.id === item.variantId)
          item.variationName = formatVariationName(variant?.attributes)
        } catch {
          // Keep the order visible even if the product fallback lookup fails.
        }
      }),
    ),
  )

  return orders
}

export const customerOrdersService = {
  async list(): Promise<{ items: Pedido[]; total: number }> {
    const response = await api.getEnvelope<CustomerOrderResponse[]>('/me/orders')
    const items = await enrichOrderVariations((response.data || []).map(mapCustomerOrder))
    return {
      items,
      total: response.meta?.total ?? items.length,
    }
  },

  async getById(id: string): Promise<PedidoDetalhe> {
    const order = await api.get<CustomerOrderResponse>(`/orders/${id}`)
    const [mapped] = await enrichOrderVariations([mapCustomerOrder(order)])
    return mapped as PedidoDetalhe
  },
}
