import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { pagamentoService, type PagamentoLinha } from '../../services/pagamento.service'
import { pedidoService, type PedidoDetalhe } from '../../services/pedido.service'
import { CalendarDays, CheckCircle2, Clock, CreditCard, DollarSign, Package, QrCode, ReceiptText, Search, X, XCircle } from 'lucide-react'

const statusFilters = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PAID', label: 'Pagos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'FAILED', label: 'Falhas' },
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function paymentStatusLabel(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'PAID') return 'Pago'
  if (normalized === 'PENDING') return 'Pendente'
  if (normalized === 'FAILED') return 'Falhou'
  if (normalized === 'REFUNDED') return 'Estornado'
  return status
}

function orderStatusLabel(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'SHIPPED') return 'Em transporte'
  if (normalized === 'PROCESSING') return 'Em separacao'
  if (normalized === 'PENDING_PAYMENT') return 'Aguardando pagamento'
  if (normalized === 'DELIVERED') return 'Entregue'
  if (normalized === 'CANCELED') return 'Cancelado'
  return status
}

function paymentBadgeClass(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700'
  if (normalized === 'PENDING') return 'bg-amber-50 text-amber-700'
  if (normalized === 'FAILED') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-600'
}

function paymentIcon(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'PAID') return CheckCircle2
  if (normalized === 'PENDING') return Clock
  if (normalized === 'FAILED') return XCircle
  return ReceiptText
}

function methodIcon(method: string) {
  if (method === 'Pix') return QrCode
  if (method === 'Boleto') return ReceiptText
  return CreditCard
}

function formatAddress(order: PedidoDetalhe) {
  const address = order.shippingAddressSnapshot
  if (!address?.street) return 'Endereco nao informado'
  return `${address.street}, ${address.number || 's/n'} - ${address.district || ''}, ${address.city || ''}/${address.state || ''} - ${address.zipCode || ''}`
}

function methodFor(_orderId: string) {
  return 'Não informado'
}

export default function Pagamentos() {
  const [items, setItems] = useState<PagamentoLinha[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState<PedidoDetalhe | null>(null)
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await pagamentoService.list({ page: 1, limit: 50 })
        setItems(response.items)
      } catch {
        toast.error('Erro ao carregar pagamentos')
      }
    }

    void load()
  }, [])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const statusMatch = status === 'ALL' || item.paymentStatus.toUpperCase() === status
      const queryMatch = !query || [
        item.orderId,
        item.customerName,
        item.paymentStatus,
        item.orderStatus,
        methodFor(item.orderId),
      ].join(' ').toLowerCase().includes(query)

      return statusMatch && queryMatch
    })
  }, [items, search, status])

  const totals = useMemo(() => {
    const paid = items.filter((item) => item.paymentStatus.toUpperCase() === 'PAID')
    const pending = items.filter((item) => item.paymentStatus.toUpperCase() === 'PENDING')
    const failed = items.filter((item) => item.paymentStatus.toUpperCase() === 'FAILED')

    return {
      approvedTotal: paid.reduce((sum, item) => sum + item.amount, 0),
      pendingTotal: pending.reduce((sum, item) => sum + item.amount, 0),
      failedCount: failed.length,
      transactions: items.length,
    }
  }, [items])

  const methodSummary = useMemo(() => (
    items.reduce<Record<string, { count: number; total: number }>>((acc, item) => {
      const method = methodFor(item.orderId)
      acc[method] = acc[method] ?? { count: 0, total: 0 }
      acc[method].count += 1
      acc[method].total += item.amount
      return acc
    }, {})
  ), [items])

  async function openOrderModal(orderId: string) {
    try {
      setLoadingOrderId(orderId)
      setSelectedOrder(await pedidoService.getById(orderId))
    } catch {
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoadingOrderId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">E-commerce</p>
          <h2 className="text-2xl font-bold text-slate-950">Pagamentos</h2>
          <p className="text-sm text-slate-500">Acompanhe valores aprovados, pendencias, falhas e metodos usados nos pedidos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Total aprovado</p>
            <DollarSign size={18} className="text-[#c99b00]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(totals.approvedTotal)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Aguardando</p>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(totals.pendingTotal)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Falhas</p>
            <XCircle size={18} className="text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{totals.failedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Transacoes</p>
            <ReceiptText size={18} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{totals.transactions}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por pedido, cliente, status ou metodo"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors cursor-pointer ${
                  status === option.value
                    ? 'bg-[#f5c518] text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-[#f5c518]/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
              Nenhum pagamento encontrado
            </div>
          ) : (
            filteredItems.map((item) => {
              const method = methodFor(item.orderId)
              const MethodIcon = methodIcon(method)
              const StatusIcon = paymentIcon(item.paymentStatus)

              return (
                <button
                  key={item.orderId}
                  type="button"
                  onClick={() => void openOrderModal(item.orderId)}
                  disabled={loadingOrderId === item.orderId}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#f5c518]/60 disabled:cursor-wait disabled:opacity-70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-950">{item.orderId}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${paymentBadgeClass(item.paymentStatus)}`}>
                          <StatusIcon size={13} />
                          {paymentStatusLabel(item.paymentStatus)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {orderStatusLabel(item.orderStatus)}
                        </span>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Cliente</p>
                          <p className="truncate font-semibold text-slate-800">{item.customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Metodo</p>
                          <p className="inline-flex items-center gap-2 font-semibold text-slate-800">
                            <MethodIcon size={15} className="text-[#c99b00]" />
                            {method}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Data</p>
                          <p className="inline-flex items-center gap-1.5 text-slate-600">
                            <CalendarDays size={14} />
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      {item.itemsPreview?.length ? (
                        <div className="mt-3 flex min-w-0 items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <Package size={14} className="mt-0.5 shrink-0 text-[#c99b00]" />
                          <p className="min-w-0 break-words [overflow-wrap:anywhere]">
                            {item.itemsPreview.map((preview) => `${preview.quantity}x ${preview.productName || 'Produto'}`).join(' + ')}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-right lg:min-w-40">
                      <p className="text-xs font-semibold text-slate-400">Valor</p>
                      <p className="text-xl font-black text-slate-950">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-black text-slate-950">Metodos de pagamento</h3>
            <p className="mt-1 text-sm text-slate-500">Distribuicao das transacoes carregadas.</p>

            <div className="mt-4 space-y-3">
              {Object.entries(methodSummary).map(([method, data]) => {
                const MethodIcon = methodIcon(method)
                const percent = items.length ? Math.round((data.count / items.length) * 100) : 0

                return (
                  <div key={method} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#8a6a00]">
                          <MethodIcon size={17} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-950">{method}</p>
                          <p className="text-xs text-slate-500">{data.count} transacoes</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-950">{percent}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#f5c518]" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{formatCurrency(data.total)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-black text-slate-950">Status financeiro</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Aprovados</span>
                <span className="font-bold text-emerald-700">{items.filter((item) => item.paymentStatus.toUpperCase() === 'PAID').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pendentes</span>
                <span className="font-bold text-amber-700">{items.filter((item) => item.paymentStatus.toUpperCase() === 'PENDING').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Falhas</span>
                <span className="font-bold text-red-700">{items.filter((item) => item.paymentStatus.toUpperCase() === 'FAILED').length}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#c99b00]">Pedido completo</p>
                <h3 className="mt-1 break-words font-mono text-lg font-black text-slate-950 [overflow-wrap:anywhere]">{selectedOrder.id}</h3>
                <p className="text-sm text-slate-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar pedido"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Cliente</p>
                  <p className="mt-1 break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">{selectedOrder.customer?.name || selectedOrder.customer?.email || 'Cliente'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{orderStatusLabel(selectedOrder.status)}</p>
                  <p className="text-xs text-slate-500">{paymentStatusLabel(selectedOrder.paymentStatus || 'PENDING')}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Total</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Package size={14} />
                  Itens do pedido
                </p>
                <div className="space-y-2">
                  {(selectedOrder.items ?? []).map((orderItem) => (
                    <div key={orderItem.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-950 [overflow-wrap:anywhere]">{orderItem.quantity}x {orderItem.productName || 'Produto'}</p>
                        <p className="break-words text-xs text-slate-500 [overflow-wrap:anywhere]">{orderItem.productCode || orderItem.productId}</p>
                        {orderItem.variationName ? <p className="mt-1 break-words text-xs font-semibold text-[#8a6a00] [overflow-wrap:anywhere]">{orderItem.variationName}</p> : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-950">{formatCurrency(orderItem.subtotal)}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(orderItem.unitPrice)} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <CalendarDays size={14} />
                  Entrega
                </p>
                <p className="break-words text-sm text-slate-700 [overflow-wrap:anywhere]">{formatAddress(selectedOrder)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
