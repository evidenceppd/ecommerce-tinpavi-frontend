import { useState, useRef, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, AlertTriangle, ArrowLeft, Save,
  GripVertical, Image as ImageIcon, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'
import { nossaEquipeService, type NossaEquipe } from '../../services/nossaEquipe.service'

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent'
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

interface MembroFormData {
  nome: string
  sobrenome: string
  cargo: string
  descricao: string
  imageUrl: string
  ordem: number
}

const formDefaults: MembroFormData = {
  nome: '',
  sobrenome: '',
  cargo: '',
  descricao: '',
  imageUrl: '',
  ordem: 0,
}

type ViewMode = 'list' | 'form'

// ── Member Card Preview — identical to Team.tsx on the site ─────────────────
function MembroPreview({ form }: { form: MembroFormData }) {
  const imgSrc = form.imageUrl ? resolveImageUrl(form.imageUrl) : null

  const DISPLAY = "'Aristotelica Pro Display', sans-serif"
  const TEXT    = "'Aristotelica Pro Text', sans-serif"

  return (
    <section
      className="overflow-hidden rounded-xl py-12 sm:py-24"
      style={{ background: '#0A0A0A' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-16 xl:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">

            {/* Text */}
            <div className="order-2 lg:order-1 text-center lg:text-left min-w-0 overflow-hidden">

              {/* "Equipe" label */}
              <h2
                className="text-[1.5rem] sm:text-[1.8rem] font-bold mb-3 sm:mb-5"
                style={{
                  fontFamily: DISPLAY,
                  backgroundImage: 'linear-gradient(to right,#f5c518 0%,#f5c518 30%,#F0D882 50%,#f5c518 70%,#f5c518 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                Equipe
              </h2>

              {/* Name */}
              <h2
                className="font-light text-white leading-[1.05] break-all"
                style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 7vw, 4.5rem)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {form.nome || 'Nome do membro'}
                <br />
                <span className="font-light" style={{ fontFamily: DISPLAY }}>{form.sobrenome || 'Sobrenome'}</span>
              </h2>

              {/* Role */}
              <h2
                className="text-[1.2rem] sm:text-[1.5rem] mb-5 sm:mb-8 mt-[-4px] sm:mt-[-9px] break-all"
                style={{
                  fontFamily: DISPLAY,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  backgroundImage: 'linear-gradient(to right,#f5c518 0%,#f5c518 30%,#F0D882 50%,#f5c518 70%,#f5c518 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                {form.cargo || 'Cargo'}
              </h2>

              {/* Bio */}
              <p
                className="text-white text-sm sm:text-[18px] leading-relaxed sm:leading-[23px] mb-4 whitespace-pre-line break-words"
                style={{ fontFamily: TEXT, fontWeight: 200 }}
              >
                {form.descricao || 'Descrição do membro da equipe...'}
              </p>

            </div>

            {/* Image */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={form.nome}
                  className="rounded-[2rem] max-h-[420px] sm:max-h-[600px] w-auto object-cover object-top"
                />
              ) : (
                <div className="w-[200px] h-[280px] rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center">
                  <ImageIcon size={36} className="text-[#f5c518]/40" />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

// ── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({
  nome,
  onConfirm,
  onCancel,
}: {
  nome: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#111] rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Excluir membro</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">"{nome}"</span>? Esta
          ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Equipe() {
  const [members, setMembers] = useState<NossaEquipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const touchDragRef = useRef<{ idx: number; startY: number } | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const [view, setView] = useState<ViewMode>('list')
  const [editingMember, setEditingMember] = useState<NossaEquipe | null>(null)
  const [form, setForm] = useState<MembroFormData>(formDefaults)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nossaEquipeService.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setMembers([...data].sort((a, b) => a.ordem - b.ordem))
        }
      })
      .catch(() => toast.error('Erro ao carregar equipe'))
      .finally(() => setLoading(false))
  }, [])

  // ── Drag & drop reorder ───────────────────────────────────────────────────
  const handleDrop = async (targetIdx: number) => {
    setDragOverIdx(null)
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      return
    }
    const next = [...members]
    const [moved] = next.splice(draggedIdx, 1)
    next.splice(targetIdx, 0, moved)
    setMembers(next)
    setDraggedIdx(null)
    setSavingOrder(true)
    try {
      await nossaEquipeService.reorder(next.map((m) => m.id))
      toast.success('Ordem salva!')
    } catch {
      toast.error('Erro ao salvar ordem')
    } finally {
      setSavingOrder(false)
    }
  }

  // ── Touch drag (mobile) — only triggered from the grip handle ─────────────
  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    e.stopPropagation()
    touchDragRef.current = { idx, startY: e.touches[0].clientY }
    setDraggedIdx(idx)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragRef.current) return
    e.preventDefault()
    const y = e.touches[0].clientY
    let overIdx: number | null = null
    rowRefs.current.forEach((row, i) => {
      if (!row) return
      const rect = row.getBoundingClientRect()
      if (y >= rect.top && y <= rect.bottom) overIdx = i
    })
    setDragOverIdx(overIdx)
  }

  const handleTouchEnd = () => {
    if (touchDragRef.current === null) return
    const target = dragOverIdx
    touchDragRef.current = null
    if (target !== null) handleDrop(target)
    else { setDraggedIdx(null); setDragOverIdx(null) }
  }

  // ── Open form ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingMember(null)
    setForm({ ...formDefaults, ordem: members.length })
    setView('form')
  }

  const openEdit = (m: NossaEquipe) => {
    setEditingMember(m)
    setForm({
      nome: (m as any).nome ?? '',
      sobrenome: (m as any).sobrenome ?? '',
      cargo: m.cargo ?? '',
      descricao: (m as any).descricao ?? '',
      imageUrl: m.imageUrl ?? '',
      ordem: m.ordem ?? 0,
    })
    setView('form')
  }

  // ── Upload image ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, 'equipe')
      setForm((f) => ({ ...f, imageUrl: result.url }))
      toast.success('Imagem enviada!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao enviar imagem'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.cargo.trim()) { toast.error('Cargo é obrigatório'); return }
    if (!form.imageUrl) { toast.error('Foto é obrigatória'); return }

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        cargo: form.cargo.trim(),
        imageUrl: form.imageUrl,
        ordem: form.ordem,
        // extended fields — sent if backend supports them
        ...(form.sobrenome.trim() && { sobrenome: form.sobrenome.trim() }),
        ...(form.descricao.trim() && { descricao: form.descricao.trim() }),
      } as any

      if (editingMember) {
        const updated = await nossaEquipeService.update(editingMember.id, payload)
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...updated } : m)),
        )
        toast.success('Membro atualizado!')
      } else {
        const created = await nossaEquipeService.create(payload)
        setMembers((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem))
        toast.success('Membro criado!')
      }
      setView('list')
    } catch {
      toast.error('Erro ao salvar membro')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await nossaEquipeService.delete(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success('Membro excluído!')
    } catch {
      toast.error('Erro ao excluir membro')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Form view ────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingMember ? 'Editar membro' : 'Novo membro'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editingMember ? 'Atualize as informações do membro da equipe' : 'Adicione um novo membro à equipe'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Form fields */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Informações
            </h2>

            {/* Nome + Sobrenome */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nome <span className="text-red-400">*</span></label>
                <input
                  className={inputCls}
                  placeholder="Ex.: Dr. Paulo Tadeu"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Parte em fonte leve</p>
              </div>
              <div>
                <label className={labelCls}>Sobrenome / Destaque</label>
                <input
                  className={inputCls}
                  placeholder="Ex.: Rotoli Drefahl"
                  value={form.sobrenome}
                  onChange={(e) => setForm((f) => ({ ...f, sobrenome: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Parte em fonte leve</p>
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label className={labelCls}>Cargo <span className="text-red-400">*</span></label>
              <input
                className={inputCls}
                placeholder="Ex.: Cirurgião Plástico"
                value={form.cargo}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div>
              <label className={labelCls}>Descrição / Bio</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={5}
                placeholder="Descrição do membro da equipe..."
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            {/* Foto */}
            <div>
              <label className={labelCls}>Foto <span className="text-red-500">*</span></label>
              <div className="flex items-start gap-4">
                {form.imageUrl ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={resolveImageUrl(form.imageUrl)}
                      alt="Preview"
                      className="w-24 h-32 object-cover object-top rounded-xl border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer"
                      aria-label="Remover foto"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    id="equipe-img-upload"
                  />
                  <label
                    htmlFor="equipe-img-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <ImageIcon size={14} />
                    {uploading ? 'Enviando...' : 'Selecionar foto'}
                  </label>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Recomendado: <span className="font-medium">600 × 800 px</span> (retrato 3:4) · JPG, PNG ou WebP · máx. <span className="font-medium">5 MB</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider px-1">
              Pré-visualização
            </h2>
            <MembroPreview form={form} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pb-4">
          <button
            onClick={() => setView('list')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundImage: NOISE, backgroundSize: '200px 200px', backgroundColor: '#f5c518' }}
          >
            <Save size={15} />
            {saving ? 'Salvando...' : editingMember ? 'Salvar alterações' : 'Criar membro'}
          </button>
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Delete modal */}
      {deletingId && (
        <DeleteModal
          nome={members.find((m) => m.id === deletingId)?.nome ?? ''}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Equipe</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie os membros exibidos na seção Equipe do site
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] self-start sm:self-auto transition-colors cursor-pointer"
          style={{ backgroundImage: NOISE, backgroundSize: '200px 200px', backgroundColor: '#f5c518' }}
        >
          <Plus size={15} />
          Novo membro
        </button>
      </div>

      {/* Saving order indicator */}
      {savingOrder && (
        <div className="flex items-center gap-2 text-sm text-[#f5c518] bg-[#f5c518]/10 rounded-xl px-4 py-2.5">
          <Save size={14} />
          Salvando nova ordem...
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#f5c518]/30 border-t-[#f5c518] rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Nenhum membro cadastrado</p>
          <p className="text-sm">Clique em "Novo membro" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div
              key={m.id}
              ref={(el) => { rowRefs.current[idx] = el }}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedIdx(idx) }}
              onDragEnter={() => setDragOverIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIdx(null) }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null) }}
              className={`group flex items-center gap-4 bg-white dark:bg-[#111] rounded-2xl border p-4 transition-all duration-200 ${draggedIdx === null ? '' : 'cursor-grabbing'} ${
                draggedIdx === idx
                  ? 'opacity-40 border-[#f5c518]/60 scale-[0.98] shadow-lg'
                  : dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx
                  ? 'border-[#f5c518] shadow-[0_0_0_2px_rgba(245, 197, 24,0.35)] bg-[#f5c518]/5 dark:bg-[#f5c518]/8'
                  : 'border-gray-100 dark:border-gray-700/50 hover:border-[#f5c518]/30'
              }`}
            >
              {/* Drag handle — desktop: drag whole row; mobile: touch only this handle */}
              <div
                className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-[#f5c518]/60 transition-colors touch-none cursor-grab active:cursor-grabbing"
                onTouchStart={(e) => handleTouchStart(e, idx)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <GripVertical size={18} />
              </div>

              {/* Order badge */}
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#f5c518]/10 text-[#f5c518] text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>

              {/* Photo */}
              {m.imageUrl ? (
                <img
                  src={resolveImageUrl(m.imageUrl)}
                  alt={m.nome}
                  className="flex-shrink-0 w-12 h-14 rounded-xl object-cover object-top border border-gray-100 dark:border-gray-700"
                />
              ) : (
                <div className="flex-shrink-0 w-12 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                  <ImageIcon size={14} className="text-gray-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {m.nome}{(m as any).sobrenome ? ` ${(m as any).sobrenome}` : ''}
                </p>
                <p className="text-xs text-[#f5c518] truncate mt-0.5">{m.cargo}</p>
                {(m as any).descricao && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 line-clamp-1">
                    {(m as any).descricao}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(m)}
                  className="p-2 rounded-lg hover:bg-[#f5c518]/10 text-gray-400 hover:text-[#f5c518] transition-colors cursor-pointer"
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeletingId(m.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag hint */}
      {members.length > 1 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Arraste os blocos para reordenar. A ordem é salva automaticamente.
        </p>
      )}
    </div>
  )
}

