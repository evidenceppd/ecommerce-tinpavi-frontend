import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { clienteService, type ClienteDetalhe, type ClienteResumo } from '../../services/cliente.service'
import { pedidoService, type PedidoDetalhe } from '../../services/pedido.service'
import { ArrowDownAZ, ArrowUpAZ, CalendarDays, Mail, MapPin, Package, Search, ShoppingBag, UserRound, X } from 'lucide-react'

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Aguardando pagamento',
    PAID: 'Pago',
    SHIPPED: 'Em transporte',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  }

  return labels[status] ?? status
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
    PAID: 'bg-emerald-50 text-emerald-700',
    SHIPPED: 'bg-blue-50 text-blue-700',
    DELIVERED: 'bg-teal-50 text-teal-700',
    CANCELLED: 'bg-red-50 text-red-600',
    REFUNDED: 'bg-slate-100 text-slate-600',
  }

  return classes[status] ?? 'bg-slate-100 text-slate-600'
}

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountryCode}`
}

function orderItemsSummary(order: NonNullable<ClienteDetalhe['orders']>[number]) {
  if (!order.items?.length) return 'Itens nao carregados'
  return order.items
    .slice(0, 2)
    .map((item) => {
      const variant = item.variationName ? ` (${item.variationName})` : ''
      return `${item.quantity}x ${item.productName || 'Produto'}${variant}`
    })
    .join(' + ') + (order.items.length > 2 ? ` +${order.items.length - 2}` : '')
}

function shortOrderCode(id: string) {
  if (id.length <= 12) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

function formatAddress(order: PedidoDetalhe) {
  const address = order.shippingAddressSnapshot
  if (!address?.street) return 'Endereco nao informado'
  return `${address.street}, ${address.number || 's/n'} - ${address.district || ''}, ${address.city || ''}/${address.state || ''} - ${address.zipCode || ''}`
}

type RoleFilter = '' | 'CUSTOMER' | 'ADMIN'
type QuickFilter = '' | 'with_orders' | 'no_orders' | 'with_phone'

const PAGE_SIZE = 30

const QUICK_OPTIONS: { value: QuickFilter; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'with_orders', label: 'Com pedidos' },
  { value: 'no_orders', label: 'Sem pedidos' },
  { value: 'with_phone', label: 'Com telefone' },
]

export default function Clientes() {
  const [items, setItems] = useState<ClienteResumo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)
  const [selected, setSelected] = useState<ClienteDetalhe | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PedidoDetalhe | null>(null)
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter] = useState<RoleFilter>('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  const load = async (pageToLoad: number, replace: boolean) => {
    setListLoading(true)
    try {
      const response = await clienteService.list({
        page: pageToLoad,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: (roleFilter as 'CUSTOMER' | 'ADMIN') || undefined,
      })
      setItems((prev) => replace ? response.items : [...prev, ...response.items])
      setTotal(response.total)
      setPage(pageToLoad)
    } catch {
      toast.error('Falha ao carregar clientes')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void load(1, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter])

  const filteredItems = useMemo(() => {
    let result = items
    if (quickFilter) {
      result = result.filter((item) => {
        if (quickFilter === 'with_orders') return (item.ordersCount ?? 0) > 0
        if (quickFilter === 'no_orders') return (item.ordersCount ?? 0) === 0
        if (quickFilter === 'with_phone') return Boolean(item.phone)
        return true
      })
    }
    return [...result].sort((a, b) =>
      sortOrder === 'asc'
        ? a.name.localeCompare(b.name, 'pt-BR')
        : b.name.localeCompare(a.name, 'pt-BR')
    )
  }, [items, quickFilter, sortOrder])

  const totals = useMemo(() => ({
    total,
    customers: items.filter((item) => item.role === 'CUSTOMER').length,
    withPhone: items.filter((item) => Boolean(item.phone)).length,
    selectedOrders: selected?.orders?.length ?? 0,
  }), [total, items, selected])

  const selectedRevenue = useMemo(() => (
    (selected?.orders ?? []).reduce((sum, order) => sum + order.total, 0)
  ), [selected])

  const handleSelect = async (id: string) => {
    try {
      const detail = await clienteService.getById(id)
      setSelected(detail)
    } catch {
      toast.error('Falha ao carregar detalhes do cliente')
    }
  }

  const handleOpenOrder = async (id: string) => {
    setLoadingOrderId(id)
    try {
      setSelectedOrder(await pedidoService.getById(id))
    } catch {
      toast.error('Falha ao carregar detalhes do pedido')
    } finally {
      setLoadingOrderId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">E-commerce</p>
          <h2 className="text-2xl font-bold text-slate-950">Clientes</h2>
          <p className="text-sm text-slate-500">Consulte cadastro, contatos, enderecos e historico de compras.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Clientes cadastrados</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Compradores</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totals.customers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Com telefone</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totals.withPhone}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pedidos do cliente</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{totals.selectedOrders}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, email, telefone ou perfil"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

<div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filtro rápido:</span>
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setQuickFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                quickFilter === opt.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="space-y-3">
          {total > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Exibindo <span className="font-bold text-slate-600">{filteredItems.length}</span> de <span className="font-bold text-slate-600">{total}</span> clientes
              </p>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#f5c518] hover:text-slate-950"
                title={sortOrder === 'asc' ? 'Ordenar Z→A' : 'Ordenar A→Z'}
              >
                {sortOrder === 'asc' ? <ArrowDownAZ size={15} /> : <ArrowUpAZ size={15} />}
                Nome {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
              </button>
            </div>
          )}

          {listLoading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
              Carregando clientes...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
              Nenhum cliente encontrado
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleSelect(item.id)}
                className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition cursor-pointer ${
                  selected?.id === item.id
                    ? 'border-[#f5c518] ring-2 ring-[#f5c518]/20'
                    : 'border-slate-200 hover:border-[#f5c518]/60'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5c518]/15 text-sm font-black text-[#8a6a00]">
                      {initials(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 break-words font-bold text-slate-950 [overflow-wrap:anywhere]">{item.name}</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Ativo</span>
                      </div>
                      <div className="mt-1 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                        <span className="inline-flex min-w-0 items-start gap-1.5">
                          <Mail size={14} className="mt-0.5 shrink-0" />
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item.email}</span>
                        </span>
                        {item.phone ? (
                          <span className="break-words [overflow-wrap:anywhere]">{item.phone}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                </div>
              </button>
            ))
          )}

          {!listLoading && items.length < total && (
            <button
              type="button"
              onClick={() => void load(page + 1, false)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#f5c518] hover:text-slate-950"
            >
              Carregar mais ({total - items.length} restantes)
            </button>
          )}

          {listLoading && items.length > 0 && (
            <p className="py-2 text-center text-xs text-slate-400">Carregando...</p>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
          {!selected ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center text-slate-400">
              <UserRound size={36} strokeWidth={1.5} />
              <div>
                <p className="font-semibold text-slate-600">Selecione um cliente</p>
                <p className="mt-1 text-sm">Os dados de contato, enderecos e pedidos aparecem aqui.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5c518] text-base font-black text-slate-950">
                  {initials(selected.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-black text-slate-950 [overflow-wrap:anywhere]">{selected.name}</h3>
                  <p className="break-words text-sm text-slate-500 [overflow-wrap:anywhere]">{selected.email}</p>
                  {selected.phone ? (
                    <a
                      href={whatsappUrl(selected.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M17.6 6.31999C16.8669 5.58141 15.9943 4.99596 15.033 4.59767C14.0716 4.19938 13.0406 3.99622 12 3.99999C10.6089 4.00135 9.24248 4.36819 8.03771 5.06377C6.83294 5.75935 5.83208 6.75926 5.13534 7.96335C4.4386 9.16745 4.07046 10.5335 4.06776 11.9246C4.06507 13.3158 4.42793 14.6832 5.12 15.89L4 20L8.2 18.9C9.35975 19.5452 10.6629 19.8891 11.99 19.9C14.0997 19.9001 16.124 19.0668 17.6222 17.5816C19.1205 16.0965 19.9715 14.0796 19.99 11.97C19.983 10.9173 19.7682 9.87634 19.3581 8.9068C18.948 7.93725 18.3505 7.05819 17.6 6.31999ZM12 18.53C10.8177 18.5308 9.65701 18.213 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.55925 14.0667 5.24174 12.429 5.51762 10.8372C5.7935 9.24545 6.64361 7.81015 7.9069 6.80322C9.1702 5.79628 10.7589 5.28765 12.3721 5.37368C13.9853 5.4597 15.511 6.13441 16.66 7.26999C17.916 8.49818 18.635 10.1735 18.66 11.93C18.6442 13.6859 17.9355 15.3645 16.6882 16.6006C15.441 17.8366 13.756 18.5301 12 18.53ZM15.61 13.59C15.41 13.49 14.44 13.01 14.26 12.95C14.08 12.89 13.94 12.85 13.81 13.05C13.6144 13.3181 13.404 13.5751 13.18 13.82C13.07 13.96 12.95 13.97 12.75 13.82C11.6097 13.3694 10.6597 12.5394 10.06 11.47C9.85 11.12 10.26 11.14 10.64 10.39C10.6681 10.3359 10.6827 10.2759 10.6827 10.215C10.6827 10.1541 10.6681 10.0941 10.64 10.04C10.64 9.93999 10.19 8.95999 10.03 8.56999C9.87 8.17999 9.71 8.23999 9.58 8.22999H9.19C9.08895 8.23154 8.9894 8.25465 8.898 8.29776C8.8066 8.34087 8.72546 8.403 8.66 8.47999C8.43562 8.69817 8.26061 8.96191 8.14676 9.25343C8.03291 9.54495 7.98287 9.85749 8 10.17C8.0627 10.9181 8.34443 11.6311 8.81 12.22C9.6622 13.4958 10.8301 14.5293 12.2 15.22C12.9185 15.6394 13.7535 15.8148 14.58 15.72C14.8552 15.6654 15.1159 15.5535 15.345 15.3915C15.5742 15.2296 15.7667 15.0212 15.91 14.78C16.0428 14.4856 16.0846 14.1583 16.03 13.84C15.94 13.74 15.81 13.69 15.61 13.59Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="break-words [overflow-wrap:anywhere]">{selected.phone}</span>
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Pedidos</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{selected.orders?.length ?? 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Total comprado</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{currency(selectedRevenue)}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <MapPin size={14} />
                  Enderecos
                </div>
                {(selected.addresses ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">Nenhum endereco cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {(selected.addresses ?? []).map((address) => (
                      <div key={address.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="break-words font-bold text-slate-950 [overflow-wrap:anywhere]">{address.label || 'Endereco'}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{address.zipCode}</span>
                        </div>
                        <p className="break-words text-slate-600 [overflow-wrap:anywhere]">
                          {address.street}, {address.number} - {address.district}
                          <br />
                          {address.city}/{address.state}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <ShoppingBag size={14} />
                  Ultimos pedidos
                </div>
                {(selected.orders ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {(selected.orders ?? []).slice(0, 4).map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => void handleOpenOrder(order.id)}
                        className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-[#f5c518] hover:shadow-sm disabled:cursor-wait disabled:opacity-70"
                        disabled={loadingOrderId === order.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-black text-slate-950">{shortOrderCode(order.id)}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">{orderItemsSummary(order)}</p>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarDays size={13} />
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-950">{currency(order.total)}</p>
                            <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(order.status)}`}>
                              {statusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </aside>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#c99b00]">Compra completa</p>
                <h3 className="mt-1 font-mono text-lg font-black text-slate-950">{selectedOrder.id}</h3>
                <p className="text-sm text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Status</p>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(selectedOrder.status)}`}>
                    {statusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Cliente</p>
                  <p className="mt-1 break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">{selectedOrder.customer?.name || selected?.name || 'Cliente'}</p>
                  <p className="break-words text-xs text-slate-500 [overflow-wrap:anywhere]">{selectedOrder.customer?.email || selected?.email}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Total</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{currency(selectedOrder.total)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Package size={14} />
                  Itens comprados
                </p>
                <div className="space-y-2">
                  {(selectedOrder.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-950 [overflow-wrap:anywhere]">{item.quantity}x {item.productName || 'Produto'}</p>
                        <p className="break-words text-xs text-slate-500 [overflow-wrap:anywhere]">{item.productCode || 'Sem codigo'}</p>
                        {item.variationName ? <p className="mt-1 break-words text-xs font-semibold text-[#8a6a00] [overflow-wrap:anywhere]">{item.variationName}</p> : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-950">{currency(item.subtotal)}</p>
                        <p className="text-xs text-slate-500">{currency(item.unitPrice)} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <MapPin size={14} />
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
