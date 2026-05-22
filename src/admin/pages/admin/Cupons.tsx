import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cupomService, type Cupom, type CupomTipo } from '../../services/cupom.service'
import { Select } from '../../components/shared/Select'
import { DateTimePicker } from '../../components/shared/DateTimePicker'
import { CalendarDays, Edit2, Percent, Plus, Ticket, Trash2, X } from 'lucide-react'

export default function Cupons() {
  const [items, setItems] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Cupom | null>(null)
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE' as CupomTipo,
    value: 0,
    validFrom: '',
    validUntil: '',
    isActive: true,
  })

  const load = async () => {
    setLoading(true)
    try {
      const response = await cupomService.list()
      setItems(response.items)
    } catch {
      toast.error('Falha ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const isCouponModalOpen = isCreateModalOpen || Boolean(editingCoupon)

  function formatDatetimeLocal(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return offsetDate.toISOString().slice(0, 16)
  }

  function resetForm() {
    setForm({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      validFrom: '',
      validUntil: '',
      isActive: true,
    })
  }

  function openCreateModal() {
    resetForm()
    setEditingCoupon(null)
    setIsCreateModalOpen(true)
  }

  function openEditModal(coupon: Cupom) {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      validFrom: formatDatetimeLocal(coupon.validFrom),
      validUntil: formatDatetimeLocal(coupon.validUntil),
      isActive: coupon.isActive,
    })
    setEditingCoupon(coupon)
    setIsCreateModalOpen(false)
  }

  function closeCouponModal() {
    setIsCreateModalOpen(false)
    setEditingCoupon(null)
    resetForm()
  }

  useEffect(() => {
    if (!isCouponModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    codeInputRef.current?.focus()

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCouponModal()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isCouponModalOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        isActive: form.isActive,
      }

      if (editingCoupon) {
        await cupomService.update(editingCoupon.id, payload)
        toast.success('Cupom atualizado')
      } else {
        await cupomService.create(payload)
        toast.success('Cupom criado')
      }

      closeCouponModal()
      await load()
    } catch {
      toast.error(editingCoupon ? 'Erro ao atualizar cupom' : 'Erro ao criar cupom')
    }
  }

  const handleDelete = async (coupon: Cupom) => {
    const confirmed = window.confirm(`Excluir o cupom ${coupon.code}?`)
    if (!confirmed) return

    setDeletingCouponId(coupon.id)
    try {
      await cupomService.remove(coupon.id)
      toast.success('Cupom excluido')
      await load()
    } catch {
      toast.error('Erro ao excluir cupom')
    } finally {
      setDeletingCouponId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Cupons</h2>
          <p className="text-sm text-slate-500">Gerencie descontos e campanhas promocionais.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-4 text-sm font-bold text-slate-950 hover:bg-[#e0b614] cursor-pointer sm:w-auto"
        >
          <Plus size={16} />
          Novo cupom
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? <p>Carregando...</p> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#c99b00]">
                      <Ticket size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black tracking-wide text-slate-950 [overflow-wrap:anywhere]">{item.code}</h3>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 sm:shrink-0 sm:justify-start">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black text-slate-950">{item.type === 'PERCENTAGE' ? `${item.value}%` : `R$ ${item.value}`}</p>
                      <p className="text-xs text-slate-500">{item.type === 'PERCENTAGE' ? 'Percentual' : 'Valor fixo'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-950 cursor-pointer"
                        aria-label={`Editar cupom ${item.code}`}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingCouponId === item.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                        aria-label={`Excluir cupom ${item.code}`}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-2">
                    <CalendarDays size={13} />
                    <span className="truncate">{new Date(item.validFrom).toLocaleDateString('pt-BR')}</span>
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-2">
                    <Percent size={13} />
                    <span className="truncate">ate {new Date(item.validUntil).toLocaleDateString('pt-BR')}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isCouponModalOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={closeCouponModal}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cupons-modal-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5c518]/15 text-[#c99b00]">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 id="cupons-modal-title" className="text-lg font-black text-slate-950">{editingCoupon ? 'Editar cupom' : 'Cadastrar cupom'}</h3>
                  <p className="text-sm text-slate-500">Configure codigo, desconto e periodo de validade.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCouponModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Fechar modal de cadastro de cupom"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Codigo do cupom</span>
                  <input
                    ref={codeInputRef}
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Ex.: TINPAVI10"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold uppercase tracking-wide text-slate-950 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
                    required
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Tipo de desconto</span>
                  <Select
                    value={form.type}
                    onChange={(val) => setForm((prev) => ({ ...prev, type: val as CupomTipo }))}
                    options={[
                      { value: 'PERCENTAGE', label: 'Percentual' },
                      { value: 'FIXED', label: 'Valor fixo' },
                    ]}
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Valor do desconto</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      {form.type === 'PERCENTAGE' ? '%' : 'R$'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.value}
                      onChange={(e) => setForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                      className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm font-bold text-slate-950 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
                      required
                    />
                  </div>
                </label>

                <label className="flex items-end">
                  <span className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 px-3">
                    <span>
                      <span className="block text-sm font-bold text-slate-950">Cupom ativo</span>
                      <span className="block text-xs text-slate-500">Disponivel para uso na loja</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 accent-[#f5c518] cursor-pointer"
                    />
                  </span>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Inicio da validade</span>
                  <DateTimePicker
                    value={form.validFrom}
                    onChange={(value) => setForm((prev) => ({ ...prev, validFrom: value }))}
                    required
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Fim da validade</span>
                  <DateTimePicker
                    value={form.validUntil}
                    onChange={(value) => setForm((prev) => ({ ...prev, validUntil: value }))}
                    required
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[#f5c518]/30 bg-[#f5c518]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8a6a00]">Resumo</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{form.code || 'CODIGO'}</p>
                    <p className="text-sm text-slate-600">{form.isActive ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <p className="text-2xl font-black text-slate-950">
                    {form.type === 'PERCENTAGE' ? `${form.value || 0}%` : `R$ ${form.value || 0}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeCouponModal} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="h-10 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 hover:bg-[#e0b614] cursor-pointer">
                  {editingCoupon ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
