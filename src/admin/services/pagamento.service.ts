import { pedidoService, type Pedido } from './pedido.service'

export interface PagamentoLinha {
  orderId: string
  customerName: string
  amount: number
  paymentStatus: string
  orderStatus: string
  createdAt: string
  itemsPreview?: Array<{
    productName?: string
    quantity: number
  }>
}

export const pagamentoService = {
  async list(params: { page?: number; limit?: number; paymentStatus?: string } = {}): Promise<{ items: PagamentoLinha[]; total: number }> {
    const { items, total } = await pedidoService.list({
      page: params.page,
      limit: params.limit,
    })

    const mapped = items
      .filter((order) => (params.paymentStatus ? order.paymentStatus === params.paymentStatus : true))
      .map((order: Pedido) => ({
        orderId: order.id,
        customerName: order.customer?.name || order.customer?.email || 'Cliente',
        amount: order.total,
        paymentStatus: order.paymentStatus || 'PENDING',
        orderStatus: order.status,
        createdAt: order.createdAt,
        itemsPreview: order.items?.slice(0, 3).map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
      }))

    return {
      items: mapped,
      total,
    }
  },
}
