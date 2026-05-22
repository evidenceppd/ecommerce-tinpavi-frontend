import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { avaliacaoService, type Avaliacao } from '../../services/avaliacao.service'
import { MessageSquare, Search, Star, Trash2, UserRound } from 'lucide-react'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

function ratingLabel(value: number) {
  return `${value}/5`
}

export default function Avaliacoes() {
  const [items, setItems] = useState<Avaliacao[]>([])
  const [search, setSearch] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const response = await avaliacaoService.list({ limit: 50 })
      setItems(response.items)
    } catch {
      toast.error('Falha ao carregar avaliacoes')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => (
      [item.id, item.comment, item.product?.title, item.productId, item.customer?.name, item.customerId, item.status, String(item.rating)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    ))
  }, [items, search])

  const summary = useMemo(() => {
    const total = items.length
    const average = total ? items.reduce((sum, item) => sum + item.rating, 0) / total : 0
    const fiveStars = items.filter((item) => item.rating === 5).length
    const withComment = items.filter((item) => Boolean(item.comment)).length

    return { total, average, fiveStars, withComment }
  }, [items])

  const removeReview = async (id: string) => {
    try {
      setRemovingId(id)
      await avaliacaoService.remove(id)
      setItems((current) => current.filter((item) => item.id !== id))
      toast.success('Avaliacao removida')
    } catch {
      toast.error('Erro ao remover avaliacao')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">E-commerce</p>
          <h2 className="text-2xl font-bold text-slate-950">Avaliacoes</h2>
          <p className="text-sm text-slate-500">Acompanhe comentarios recebidos e remova avaliacoes indevidas da loja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Avaliacoes</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Media geral</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{summary.average.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">5 estrelas</p>
          <p className="mt-1 text-2xl font-black text-[#8a6a00]">{summary.fiveStars}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Com comentario</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{summary.withComment}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por comentario, produto, cliente ou nota"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
            Nenhuma avaliacao encontrada
          </div>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f5c518]/15 px-2.5 py-1 text-xs font-bold text-[#8a6a00]">
                      <Star size={13} className="fill-current" />
                      {ratingLabel(item.rating)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {item.id}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      Publicada
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</span>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MessageSquare size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-6 text-slate-800">{item.comment || 'Sem comentario informado.'}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={13} />
                          {item.customer?.name || item.customerId || 'Cliente nao informado'}
                        </span>
                        <span>Produto: {item.product?.title || item.productId || 'Nao informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void removeReview(item.id)}
                  disabled={removingId === item.id}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-50 px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={15} />
                  {removingId === item.id ? 'Removendo' : 'Remover'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
