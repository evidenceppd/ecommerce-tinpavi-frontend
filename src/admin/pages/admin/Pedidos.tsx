import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { pedidoService, type Pedido, type PedidoDetalhe, type PedidoStatus } from '../../services/pedido.service'
import { Select } from '../../components/shared/Select'
import { CalendarDays, ClipboardList, CreditCard, MapPin, Package, ReceiptText, Search, Truck, UserRound, X } from 'lucide-react'

const statusOptions: PedidoStatus[] = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

function translatePaymentStatus(status: string): string {
  return paymentStatusLabel[status?.toUpperCase()] ?? status
}

const statusLabel: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const statusColor: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  SHIPPED: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-teal-50 text-teal-700',
  CANCELLED: 'bg-red-50 text-red-600',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

const statusUpdateColor: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  PAID: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  SHIPPED: 'border-blue-200 text-blue-700 hover:bg-blue-50',
  DELIVERED: 'border-teal-200 text-teal-700 hover:bg-teal-50',
  CANCELLED: 'border-red-200 text-red-600 hover:bg-red-50',
  REFUNDED: 'border-slate-200 text-slate-600 hover:bg-slate-50',
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function orderNumber(id: string) {
  return `#${id.slice(-6).toUpperCase()}`
}

function orderMainItem(order: Pedido) {
  const firstItem = order.items?.[0]
  if (!firstItem) return 'Itens do pedido'
  const extraItems = (order.items?.length ?? 0) - 1
  return extraItems > 0 ? `${firstItem.productName || firstItem.productId} +${extraItems}` : firstItem.productName || firstItem.productId
}

export default function Pedidos() {
  const [items, setItems] = useState<Pedido[]>([])
  const [selected, setSelected] = useState<PedidoDetalhe | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [status, setStatus] = useState<PedidoStatus | ''>('')
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const response = await pedidoService.list({ status: status || undefined })
      setItems(response.items)
    } catch {
      toast.error('Falha ao carregar pedidos')
    }
  }

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return [
      item.id,
      item.customer?.name,
      item.customer?.email,
      item.status,
      item.paymentStatus,
    ].filter(Boolean).join(' ').toLowerCase().includes(query)
  })

  const totals = {
    count: filteredItems.length,
    revenue: filteredItems.reduce((sum, item) => sum + item.total, 0),
    pending: filteredItems.filter((item) => item.status === 'PENDING_PAYMENT').length,
    shipped: filteredItems.filter((item) => item.status === 'SHIPPED').length,
  }

  useEffect(() => {
    void load()
  }, [])

  const handleFilter = async (event: React.FormEvent) => {
    event.preventDefault()
    await load()
  }

  const handleOpen = async (id: string) => {
    try {
      const detail = await pedidoService.getById(id)
      setSelected(detail)
      requestAnimationFrame(() => requestAnimationFrame(() => setPanelVisible(true)))
    } catch {
      toast.error('Falha ao carregar detalhes do pedido')
    }
  }

  const handleClose = () => {
    setPanelVisible(false)
    setTimeout(() => setSelected(null), 250)
  }

  const handleStatusUpdate = async (newStatus: PedidoStatus) => {
    if (!selected) return
    try {
      const updated = await pedidoService.updateStatus(selected.id, newStatus)
      setSelected(updated)
      toast.success('Status atualizado')
      await load()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">E-commerce</p>
          <h2 className="text-2xl font-bold text-slate-950">Pedidos</h2>
          <p className="text-sm text-slate-500">Acompanhe compras, pagamentos, envio e histórico de cada pedido.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pedidos</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totals.count}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Faturamento</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{currency(totals.revenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Aguardando pagamento</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Em transporte</p>
          <p className="mt-1 text-2xl font-black text-blue-700">{totals.shipped}</p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por pedido, cliente, email ou status"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
            />
          </div>
          <Select
            value={status}
            onChange={(val) => setStatus(val as PedidoStatus | '')}
            placeholder="Todos os status"
            className="lg:w-64"
            options={[
              { value: '', label: 'Todos os status' },
              ...statusOptions.map((s) => ({ value: s, label: statusLabel[s] })),
            ]}
          />
          <button type="submit" className="h-10 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 cursor-pointer">Filtrar</button>
        </div>
      </form>

      <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white">
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <ClipboardList size={32} strokeWidth={1.5} />
              <p className="text-sm">Nenhum pedido encontrado</p>
            </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition ${selected?.id === item.id ? 'border-[#f5c518] ring-2 ring-[#f5c518]/20' : 'border-slate-200 hover:border-[#f5c518]/60'}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-950">{orderNumber(item.id)}</span>
                      <span className="max-w-md truncate text-sm font-semibold text-slate-700">{orderMainItem(item)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                      {item.paymentStatus ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          <CreditCard size={12} />
                          {translatePaymentStatus(item.paymentStatus)}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <UserRound size={15} className="text-slate-400" />
                        <span className="truncate">{item.customer?.name || item.customer?.email || 'Cliente nao informado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays size={15} className="text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Truck size={15} className="text-slate-400" />
                        {item.status === 'SHIPPED' ? 'Envio em andamento' : statusLabel[item.status]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:min-w-52">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400">Total</p>
                      <p className="text-lg font-black text-slate-950">{currency(item.total)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleOpen(item.id)}
                      className="h-10 rounded-lg bg-[#f5c518]/15 px-4 text-sm font-bold text-[#8a6a00] cursor-pointer hover:bg-[#f5c518]/25 transition-colors"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

      {createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-50 transition-all duration-250 ${selected && panelVisible ? 'bg-black/30 pointer-events-auto' : 'bg-black/0 pointer-events-none'}`}
            onClick={handleClose}
          />
          {/* Drawer */}
          <div
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-250 flex flex-col ${
              selected && panelVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
        {selected && (
          <>
            <div className="flex items-start justify-between border-b border-slate-100 p-4 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pedido</p>
                <p className="text-sm font-bold text-slate-950">{orderNumber(selected.id)}</p>
                <p className="mt-0.5 max-w-72 truncate text-xs text-slate-500">{orderMainItem(selected)}</p>
              </div>
              <button type="button" onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor[selected.status]}`}>
                    {statusLabel[selected.status]}
                  </span>
                  {selected.paymentStatus && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {translatePaymentStatus(selected.paymentStatus)}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente</span>
                    <span className="font-semibold text-slate-950">{selected.customer?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">E-mail</span>
                    <span className="text-slate-700">{selected.customer?.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data</span>
                    <span className="text-slate-700">{new Date(selected.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="font-bold text-slate-950">Total</span>
                    <span className="font-bold text-slate-950">{currency(selected.total)}</span>
                  </div>
                  {selected.couponSnapshot?.code && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Cupom</span>
                      <span className="font-semibold">{selected.couponSnapshot.code}</span>
                    </div>
                  )}
                </div>

                {selected.shippingAddressSnapshot?.street && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <MapPin size={13} /> Endereço de entrega
                    </div>
                    <p className="text-sm text-slate-700">
                      {selected.shippingAddressSnapshot.street}{selected.shippingAddressSnapshot.number ? `, ${selected.shippingAddressSnapshot.number}` : ''}{selected.shippingAddressSnapshot.district ? ` — ${selected.shippingAddressSnapshot.district}` : ''}
                      <br />
                      {selected.shippingAddressSnapshot.city}{selected.shippingAddressSnapshot.state ? ` / ${selected.shippingAddressSnapshot.state}` : ''}
                      {selected.shippingAddressSnapshot.zipCode ? ` — CEP ${selected.shippingAddressSnapshot.zipCode}` : ''}
                    </p>
                  </div>
                )}

                {(selected.items || []).length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Package size={13} /> Itens do pedido
                    </div>
                    <ul className="space-y-2">
                      {(selected.items || []).map((item) => (
                        <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                          <span className="min-w-0 pr-3 text-slate-800">
                            <span className="block truncate font-semibold">{item.productName || item.productId}</span>
                            <span className="text-xs text-slate-400">
                              {item.productCode ? `${item.productCode} · ` : ''}Qtd. {item.quantity}
                            </span>
                            {item.variationName && (
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                Variação: {item.variationName}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-slate-950">{currency(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selected.statusHistory || []).length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <ReceiptText size={13} /> Histórico de status
                    </div>
                    <ol className="space-y-1.5">
                      {(selected.statusHistory || []).map((entry, index) => (
                        <li key={`${entry.status}-${index}`} className="flex items-center justify-between text-sm">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor[entry.status as PedidoStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                            {statusLabel[entry.status as PedidoStatus] ?? entry.status}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(entry.changedAt).toLocaleString('pt-BR')}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Atualizar status</div>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => void handleStatusUpdate(option)}
                        disabled={selected.status === option}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${statusUpdateColor[option]}`}
                      >
                        {statusLabel[option]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
