import { useState, useRef, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, AlertTriangle, ArrowLeft, Save,
  GripVertical, X, CheckCircle2, Image as ImageIcon, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'
import {
  procedimentosService,
  mapProcedimento,
  serializeDescricao,
  type ProcedimentoBloco,
  type ProcedimentoHeroAPI,
} from '../../services/procedimentos.service'

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`

const heroDefaults: Required<ProcedimentoHeroAPI> = {
  instituteName: 'Instituto Drefahl',
  heading1: 'Nossos',
  heading2: 'Procedimentos',
  subtitle: 'Tecnologia de ponta aliada ao olhar artistico do Dr. Drefahl para resultados seguros, naturais e transformadores.',
}

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent'
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

interface BlocoFormData {
  tagline: string
  titulo: string
  paragraphs: string[]
  benefits: string[]
  ctaText: string
  imagem: string
}

const formDefaults: BlocoFormData = {
  tagline: '',
  titulo: '',
  paragraphs: ['', ''],
  benefits: ['', ''],
  ctaText: 'Agendar consulta',
  imagem: '',
}

type ViewMode = 'list' | 'form'

// ── Hero Preview ─────────────────────────────────────────────────────────────
function HeroPreview({ cfg }: { cfg: Required<ProcedimentoHeroAPI> }) {
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ background: '#0d0d0d' }}>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: NOISE, backgroundSize: '200px 200px' }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[#f5c518]/60 to-transparent" />
      <div className="relative px-6 sm:px-10 pt-8 pb-10">
        <p className="inline-flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-[0.15em] font-semibold mb-8">
          <ArrowLeft size={10} />
          Inicio
        </p>
        <p className="text-[#f5c518] text-xs uppercase tracking-[0.2em] font-semibold mb-3 break-words">
          {cfg.instituteName || heroDefaults.instituteName}
        </p>
        <h1
          className="text-white font-bold leading-[1.02] mb-4 break-words"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
        >
          {cfg.heading1 || heroDefaults.heading1}{' '}
          <span className="bg-[linear-gradient(to_right,#f5c518_0%,#F0D882_50%,#f5c518_100%)] bg-clip-text text-transparent break-words">
            {cfg.heading2 || heroDefaults.heading2}
          </span>
        </h1>
        <div className="w-14 h-[2px] bg-[#f5c518] mb-4" />
        <p className="text-white/55 text-sm leading-relaxed max-w-xl break-words whitespace-pre-line">
          {cfg.subtitle || heroDefaults.subtitle}
        </p>
      </div>
    </div>
  )
}

// ── Block Preview ─────────────────────────────────────────────────────────────
function BlocoPreview({ form, index }: { form: BlocoFormData; index: number }) {
  const isEven = index % 2 === 0
  const imgSrc = form.imagem ? resolveImageUrl(form.imagem) : null
  const indexLabel = String(index + 1).padStart(2, '0')

  return (
    <div
      style={{ backgroundColor: isEven ? '#F2EDE3' : '#EDE7DA', position: 'relative', overflow: 'hidden' }}
    >
      <span
        className="absolute select-none pointer-events-none font-bold"
        style={{
          fontSize: 'clamp(5rem, 14vw, 10rem)',
          color: 'rgba(245, 197, 24,0.06)',
          top: '-0.1em',
          right: isEven ? 0 : 'auto',
          left: isEven ? 'auto' : 0,
          lineHeight: 1,
        }}
        aria-hidden
      >
        {indexLabel}
      </span>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className={`flex flex-col gap-8 items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
          {/* Image */}
          <div className="w-full lg:w-[48%] flex-shrink-0">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.15)] group">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={form.titulo}
                  className="w-full h-[320px] sm:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="w-full h-[320px] sm:h-[420px] bg-[#DDD6CC] flex items-center justify-center">
                  <ImageIcon size={32} className="text-[#f5c518]/40" />
                </div>
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#f5c518]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div
                className="absolute top-3 left-3 text-white text-xs font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-md"
                style={{ backgroundImage: NOISE, backgroundSize: '200px 200px', backgroundColor: '#f5c518' }}
              >
                {indexLabel}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-[52%] min-w-0">
            <p className="text-[#f5c518] text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold mb-2 break-words whitespace-pre-line">
              {form.tagline || 'Tagline do procedimento'}
            </p>
            <h2
              className="text-[#1a1410] font-bold leading-none mb-3 break-words"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)' }}
            >
              {form.titulo || 'Nome do procedimento'}
            </h2>
            <div className="w-10 h-[2px] bg-[#f5c518] mb-4" />
            {form.paragraphs.filter(Boolean).map((p, i) => (
              <p key={i} className="text-[#514228]/80 text-sm leading-[1.85] mb-3 last:mb-5 whitespace-pre-line break-words">
                {p}
              </p>
            ))}
            {form.benefits.filter(Boolean).length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-6">
                {form.benefits.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#514228] text-xs sm:text-sm">
                    <CheckCircle2 size={14} className="text-[#f5c518] flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <a
                href="#contato"
                onClick={e => e.preventDefault()}
                className="text-white text-base sm:text-[1.1rem] px-6 py-2.5 rounded-[10px] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245, 197, 24,0.3)]"
                style={{ backgroundImage: NOISE, backgroundSize: '200px 200px', backgroundColor: '#f5c518' }}
              >
                {form.ctaText || 'Agendar consulta'}
              </a>
              <a
                href="#contato"
                onClick={e => e.preventDefault()}
                className="border-[1.5px] border-[#f5c518]/70 text-[#f5c518] p-2.5 rounded-[10px] hover:border-[#f5c518] transition-all duration-300 flex items-center justify-center"
              >
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f5c518]/25 to-transparent" />
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  titulo,
  onConfirm,
  onCancel,
}: {
  titulo: string
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
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Excluir procedimento</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">"{titulo}"</span>? Esta
          acao nao pode ser desfeita.
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
export default function Procedimentos() {
  const [hero, setHero] = useState<Required<ProcedimentoHeroAPI>>(heroDefaults)
  const [heroDraft, setHeroDraft] = useState<Required<ProcedimentoHeroAPI>>(heroDefaults)
  const [heroEditing, setHeroEditing] = useState(false)
  const [heroSaving, setHeroSaving] = useState(false)

  const [blocks, setBlocks] = useState<ProcedimentoBloco[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const touchDragRef = useRef<{ idx: number; startY: number } | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const [view, setView] = useState<ViewMode>('list')
  const [editingBlock, setEditingBlock] = useState<ProcedimentoBloco | null>(null)
  const [form, setForm] = useState<BlocoFormData>(formDefaults)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      procedimentosService.getHero().catch(() => null),
      procedimentosService.getAll().catch(() => []),
    ])
      .then(([heroData, blocksData]) => {
        if (heroData) {
          const merged = { ...heroDefaults, ...heroData }
          setHero(merged)
          setHeroDraft(merged)
        }
        if (Array.isArray(blocksData)) {
          setBlocks(
            (blocksData as Parameters<typeof mapProcedimento>[0][])
              .map(mapProcedimento)
              .sort((a, b) => a.ordem - b.ordem),
          )
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const saveHero = async () => {
    setHeroSaving(true)
    try {
      await procedimentosService.saveHero(heroDraft)
      setHero(heroDraft)
      setHeroEditing(false)
      toast.success('Cabecalho salvo com sucesso!')
    } catch {
      toast.error('Erro ao salvar cabecalho')
    } finally {
      setHeroSaving(false)
    }
  }

  const handleDrop = async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      return
    }
    const next = [...blocks]
    const [moved] = next.splice(draggedIdx, 1)
    next.splice(targetIdx, 0, moved)
    setBlocks(next)
    setDraggedIdx(null)
    setDragOverIdx(null)
    setSavingOrder(true)
    try {
      await procedimentosService.reorder(next.map(b => b.id))
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

  const openNewBlock = () => {
    setEditingBlock(null)
    setForm(formDefaults)
    setView('form')
  }

  const openEditBlock = (bloco: ProcedimentoBloco) => {
    setEditingBlock(bloco)
    setForm({
      tagline: bloco.tagline,
      titulo: bloco.titulo,
      paragraphs: bloco.paragraphs.length > 0 ? [...bloco.paragraphs] : [''],
      benefits: bloco.benefits.length > 0 ? [...bloco.benefits] : [''],
      ctaText: bloco.ctaText || 'Agendar consulta',
      imagem: bloco.imagem,
    })
    setView('form')
  }

  const handleDelete = async (id: number) => {
    try {
      await procedimentosService.delete(id)
      setBlocks(prev => prev.filter(b => b.id !== id))
      setDeletingId(null)
      toast.success('Procedimento excluido')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    uploadService
      .uploadImage(file, 'procedimentos')
      .then(res => setForm(prev => ({ ...prev, imagem: res.url })))
      .catch((error: any) => toast.error(error?.message || error?.response?.data?.error || 'Erro ao enviar imagem'))
      .finally(() => {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const handleSaveBlock = async () => {
    if (!form.titulo.trim()) { toast.error('O nome do procedimento e obrigatorio'); return }
    if (!form.tagline.trim()) { toast.error('A tagline e obrigatoria'); return }
    const cleanParagraphs = form.paragraphs.map(p => p.trim()).filter(Boolean)
    const cleanBenefits = form.benefits.map(b => b.trim()).filter(Boolean)
    const payload = {
      tagline: form.tagline.trim(),
      titulo: form.titulo.trim(),
      descricao: serializeDescricao({ paragraphs: cleanParagraphs, benefits: cleanBenefits, ctaText: form.ctaText.trim() }),
      imagem_capa: form.imagem || null,
      ordem: editingBlock?.ordem ?? blocks.length,
      ativo: true,
    }
    setSaving(true)
    try {
      if (editingBlock) {
        const updated = await procedimentosService.update(editingBlock.id, payload)
        const mapped = mapProcedimento(updated)
        setBlocks(prev => prev.map(b => b.id === mapped.id ? mapped : b))
        toast.success('Procedimento atualizado!')
      } else {
        const created = await procedimentosService.create(payload)
        const mapped = mapProcedimento(created)
        setBlocks(prev => [...prev, mapped])
        toast.success('Procedimento criado!')
      }
      setView('list')
    } catch {
      toast.error('Erro ao salvar procedimento')
    } finally {
      setSaving(false)
    }
  }

  const updateParagraph = (i: number, val: string) =>
    setForm(prev => { const p = [...prev.paragraphs]; p[i] = val; return { ...prev, paragraphs: p } })
  const addParagraph = () => setForm(prev => ({ ...prev, paragraphs: [...prev.paragraphs, ''] }))
  const removeParagraph = (i: number) =>
    setForm(prev => ({ ...prev, paragraphs: prev.paragraphs.filter((_, j) => j !== i) }))

  const updateBenefit = (i: number, val: string) =>
    setForm(prev => { const b = [...prev.benefits]; b[i] = val; return { ...prev, benefits: b } })
  const addBenefit = () => setForm(prev => ({ ...prev, benefits: [...prev.benefits, ''] }))
  const removeBenefit = (i: number) =>
    setForm(prev => ({ ...prev, benefits: prev.benefits.filter((_, j) => j !== i) }))

  const isEdit = editingBlock !== null
  const previewFormIndex = isEdit
    ? blocks.findIndex(b => b.id === editingBlock!.id)
    : blocks.length

  // ── FORM VIEW ────────────────────────────────────────────────────────────────
  if (view === 'form') {
    const imgSrc = form.imagem ? resolveImageUrl(form.imagem) : null
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setView('list')}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEdit ? 'Editar Procedimento' : 'Novo Procedimento'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit
                ? `Editando: ${editingBlock!.titulo}`
                : 'Configure todas as informacoes do bloco'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            {/* Image */}
            <div>
              <label className={labelCls}>Imagem do procedimento</label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#f5c518] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''} ${imgSrc ? 'p-2' : 'p-8'}`}
              >
                {uploading ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <ImageIcon size={32} className="text-gray-400 animate-pulse" />
                    <span className="text-sm text-gray-500">Enviando...</span>
                  </div>
                ) : imgSrc ? (
                  <>
                    <img src={imgSrc} alt="Imagem" className="w-full h-48 object-cover rounded-lg" />
                    <span className="text-xs text-gray-400 py-1">Clique para alterar</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Clique para enviar a imagem
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                {form.imagem && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, imagem: '' }))}
                    className="text-xs text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer"
                  >
                    Remover imagem
                  </button>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Recomendado: <span className="font-medium">1200 × 800 px</span> · JPG, PNG ou WebP · máx. <span className="font-medium">5 MB</span>
                </span>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className={labelCls}>
                Tagline{' '}
                <span className="text-gray-400 font-normal">(texto dourado acima do titulo)</span>
              </label>
              <textarea
                value={form.tagline}
                onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Ex: Definicao corporal de alta precisao"
              />
            </div>

            {/* Title */}
            <div>
              <label className={labelCls}>Nome do procedimento</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                className={inputCls}
                placeholder="Ex: Lipo HD"
              />
            </div>

            {/* Paragraphs */}
            <div>
              <label className={labelCls}>Paragrafos de descricao</label>
              <div className="space-y-2">
                {form.paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <textarea
                      value={p}
                      onChange={e => updateParagraph(i, e.target.value)}
                      rows={3}
                      className={`flex-1 ${inputCls} resize-none`}
                      placeholder={`Paragrafo ${i + 1}`}
                    />
                    {form.paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParagraph(i)}
                        className="mt-1 p-2 rounded-lg hover:bg-[#f5c518]/10 text-[#f5c518] transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addParagraph}
                className="mt-2 text-sm text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer font-medium"
              >
                + Adicionar paragrafo
              </button>
            </div>

            {/* Benefits */}
            <div>
              <label className={labelCls}>Beneficios</label>
              <div className="space-y-2">
                {form.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#f5c518] flex-shrink-0" />
                    <input
                      type="text"
                      value={b}
                      onChange={e => updateBenefit(i, e.target.value)}
                      className={`flex-1 ${inputCls}`}
                      placeholder={`Beneficio ${i + 1}`}
                    />
                    {form.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBenefit(i)}
                        className="p-1.5 rounded-lg hover:bg-[#f5c518]/10 text-[#f5c518] transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBenefit}
                className="mt-2 text-sm text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer font-medium"
              >
                + Adicionar beneficio
              </button>
            </div>

            {/* CTA */}
            <div>
              <label className={labelCls}>Texto do botao</label>
              <input
                type="text"
                value={form.ctaText}
                onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))}
                className={inputCls}
                placeholder="Ex: Agendar consulta"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setView('list')}
                disabled={saving}
                className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBlock}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                {saving ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Criar procedimento'}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Previa em tempo real
            </p>
            <BlocoPreview
              form={form}
              index={previewFormIndex >= 0 ? previewFormIndex : blocks.length}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Procedimentos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Edite o conteudo da pagina de procedimentos do site
        </p>
        {loading && <p className="text-xs text-gray-400 mt-2">Carregando...</p>}
      </div>

      {deletingId !== null && (
        <DeleteModal
          titulo={blocks.find(b => b.id === deletingId)?.titulo ?? ''}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {/* ── Hero card ── */}
      <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d0d0d] flex items-center justify-center">
              <span className="text-[#f5c518] text-xs font-bold leading-none">H</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Cabecalho da pagina</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Secao escura com titulo e subtitulo
              </p>
            </div>
          </div>
          {!heroEditing ? (
            <button
              type="button"
              onClick={() => { setHeroDraft({ ...hero }); setHeroEditing(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Pencil size={15} />
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHeroEditing(false)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveHero}
                disabled={heroSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                {heroSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>

        {heroEditing ? (
          <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Label do instituto</label>
                <input
                  type="text"
                  value={heroDraft.instituteName}
                  onChange={e => setHeroDraft(p => ({ ...p, instituteName: e.target.value }))}
                  className={inputCls}
                  placeholder="Instituto Drefahl"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Titulo — parte 1{' '}
                  <span className="text-gray-400 font-normal">(texto branco)</span>
                </label>
                <input
                  type="text"
                  value={heroDraft.heading1}
                  onChange={e => setHeroDraft(p => ({ ...p, heading1: e.target.value }))}
                  className={inputCls}
                  placeholder="Nossos"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Titulo — parte 2{' '}
                  <span className="text-gray-400 font-normal">(gradiente dourado)</span>
                </label>
                <input
                  type="text"
                  value={heroDraft.heading2}
                  onChange={e => setHeroDraft(p => ({ ...p, heading2: e.target.value }))}
                  className={inputCls}
                  placeholder="Procedimentos"
                />
              </div>
              <div>
                <label className={labelCls}>Subtitulo</label>
                <textarea
                  value={heroDraft.subtitle}
                  onChange={e => setHeroDraft(p => ({ ...p, subtitle: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Previa</p>
              <HeroPreview cfg={heroDraft} />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <HeroPreview cfg={hero} />
          </div>
        )}
      </section>

      {/* ── Blocks card ── */}
      <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f5c518]/10 flex items-center justify-center">
              <span className="text-[#f5c518] text-xs font-bold leading-none">#</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                Blocos de Procedimentos
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {blocks.length}{' '}
                {blocks.length === 1 ? 'procedimento cadastrado' : 'procedimentos cadastrados'}
                {savingOrder ? ' · salvando ordem...' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewBlock}
            className="flex items-center gap-2 px-4 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Novo Bloco
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nenhum procedimento cadastrado
            </p>
            <p className="text-sm text-gray-400 mb-5">
              Clique em "Novo Bloco" para adicionar o primeiro procedimento
            </p>
            <button
              type="button"
              onClick={openNewBlock}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Novo Bloco
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {blocks.map((bloco, idx) => {
              const imgSrc = bloco.imagem ? resolveImageUrl(bloco.imagem) : null
              const indexLabel = String(idx + 1).padStart(2, '0')
              return (
                <div
                  key={bloco.id}
                  ref={(el) => { rowRefs.current[idx] = el }}
                  draggable
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null) }}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(idx) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    draggedIdx === idx
                      ? 'border-[#f5c518] opacity-60 bg-[#f5c518]/5'
                      : dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx
                      ? 'border-[#f5c518] shadow-[0_0_0_2px_rgba(245, 197, 24,0.35)] bg-[#f5c518]/5'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <button
                    type="button"
                    className="text-gray-400 cursor-grab active:cursor-grabbing p-1 flex-shrink-0 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-none"
                    title="Arrastar para reordenar"
                    onTouchStart={(e) => handleTouchStart(e, idx)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <GripVertical size={16} />
                  </button>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={bloco.titulo}
                      className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#f5c518] font-mono">{indexLabel}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                        {bloco.titulo}
                      </span>
                    </div>
                    {bloco.tagline && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{bloco.tagline}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditBlock(bloco)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#f5c518] hover:bg-[#f5c518]/10 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(bloco.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full site preview */}
        {blocks.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Previa completa da pagina
            </p>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <HeroPreview cfg={hero} />
              {blocks.map((bloco, i) => (
                <BlocoPreview
                  key={bloco.id}
                  index={i}
                  form={{
                    tagline: bloco.tagline,
                    titulo: bloco.titulo,
                    paragraphs: bloco.paragraphs,
                    benefits: bloco.benefits,
                    ctaText: bloco.ctaText,
                    imagem: bloco.imagem,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
