import { useState, useRef, useEffect } from 'react'
import { Pencil, Save, Image, BookOpen, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { aboutUsService } from '../../services/aboutUs.service'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'

// Noise texture SVG data URI — same as About.tsx
const noiseBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`

const defaultImages = [
  '/sobrenos/IMG_0008.png',
  '/sobrenos/WhatsApp%20Image%202023-05-05%20at%2014.20.37%20(4).png',
  '/sobrenos/IMG_0780.png',
  '/procedimentos/Camara-Hiperbarica_Hospital-Ortopedico-AACD_1-scaled.png',
]

interface SobreNosConfig {
  subtitle: string
  buttonText: string
  paragraphs: string[]
  images: string[] // 4 grid images
}

const sobreNosDefaults: SobreNosConfig = {
  subtitle: 'Qualidade e segurança\nem um único lugar!',
  buttonText: 'Entre em contato',
  paragraphs: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida.',
  ],
  images: [...defaultImages],
}

function serialize(cfg: SobreNosConfig): { descricao: string; imagem_capa: string } {
  return {
    descricao: cfg.paragraphs.map(p => p.trim()).filter(Boolean).join('\n\n'),
    imagem_capa: JSON.stringify({ subtitle: cfg.subtitle, buttonText: cfg.buttonText, images: cfg.images }),
  }
}

function deserialize(descricao: string, imagem_capa: string): SobreNosConfig {
  const paragraphs = descricao.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  let subtitle = sobreNosDefaults.subtitle
  let buttonText = sobreNosDefaults.buttonText
  let images = [...defaultImages]
  try {
    const parsed = JSON.parse(imagem_capa)
    if (typeof parsed.subtitle === 'string') subtitle = parsed.subtitle
    if (typeof parsed.buttonText === 'string') buttonText = parsed.buttonText
    if (Array.isArray(parsed.images) && parsed.images.length === 4) images = parsed.images
  } catch {
    // Legacy: plain URL stored directly — use as first image
    if (imagem_capa) images[0] = imagem_capa
  }
  return {
    subtitle,
    buttonText,
    paragraphs: paragraphs.length > 0 ? paragraphs : [...sobreNosDefaults.paragraphs],
    images,
  }
}

export default function SobreNos() {
  const [config, setConfig] = useState<SobreNosConfig>(sobreNosDefaults)
  const [draft, setDraft] = useState<SobreNosConfig>(sobreNosDefaults)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  useEffect(() => {
    aboutUsService.getPublic()
      .then(data => {
        if (!data) return
        const mapped = deserialize(data.descricao, data.imagem_capa)
        setConfig(mapped)
        setDraft({ ...mapped, paragraphs: [...mapped.paragraphs], images: [...mapped.images] })
      })
      .catch(() => toast.error('Não foi possível carregar o conteúdo de Sobre nós'))
      .finally(() => setLoading(false))
  }, [])

  const openEdit = () => {
    setDraft({ ...config, paragraphs: [...config.paragraphs], images: [...config.images] })
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft({ ...config, paragraphs: [...config.paragraphs], images: [...config.images] })
    setEditing(false)
  }


  const handleSave = async () => {
    const cleanParagraphs = draft.paragraphs.map(p => p.trim()).filter(Boolean)
    if (cleanParagraphs.length === 0) {
      toast.error('Adicione pelo menos um parágrafo.')
      return
    }
    setSaving(true)
    try {
      const payload = serialize({ ...draft, paragraphs: cleanParagraphs })
      const data = await aboutUsService.update(payload)
      const mapped = deserialize(data.descricao, data.imagem_capa)
      setConfig(mapped)
      setDraft({ ...mapped, paragraphs: [...mapped.paragraphs], images: [...mapped.images] })
      setEditing(false)
      toast.success('Seção "Sobre nós" salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (imgIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIdx(imgIndex)
    uploadService.uploadImage(file, 'about-us')
      .then(result => {
        setDraft(prev => {
          const images = [...prev.images]
          images[imgIndex] = result.url
          return { ...prev, images }
        })
      })
      .catch((error: any) => toast.error(error?.message || error?.response?.data?.error || 'Erro ao enviar imagem'))
      .finally(() => setUploadingIdx(null))
    if (fileInputRefs.current[imgIndex]) fileInputRefs.current[imgIndex]!.value = ''
  }

  const updateParagraph = (index: number, value: string) => {
    setDraft(prev => {
      const p = [...prev.paragraphs]
      p[index] = value
      return { ...prev, paragraphs: p }
    })
  }

  const addParagraph = () => setDraft(prev => ({ ...prev, paragraphs: [...prev.paragraphs, ''] }))
  const removeParagraph = (i: number) => setDraft(prev => ({
    ...prev,
    paragraphs: prev.paragraphs.filter((_, idx) => idx !== i),
  }))

  const resolvedImages = config.images.map(img => img ? resolveImageUrl(img) : '')
  const resolvedDraftImages = draft.images.map(img => img ? resolveImageUrl(img) : '')

  // ── Shared preview renders the exact About.tsx layout ──────────────────────
  const renderPreview = (cfg: SobreNosConfig, imgs: string[]) => (
    <div className="admin-preview-surface rounded-xl overflow-hidden border border-[#f5c518]/20">
      <div
        className="py-10 px-6 sm:px-10"
        style={{ backgroundColor: '#F2EDE3' }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center">
          {/* Text — order-2 on mobile, order-1 on lg */}
          <div className="order-2 lg:order-1 text-center lg:text-left min-w-0">
            {/* Gold gradient label */}
            <h2
              className="leading-none mb-[10px] text-[1.6rem] sm:text-[2.2rem] font-[600] bg-gradient-to-r from-[#f5c518] via-[#F0D882] to-[#f5c518] bg-clip-text text-transparent break-words"
              style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
            >
              Sobre nós
            </h2>
            {/* Editable subtitle */}
            <h2
              className="text-[1.5rem] sm:text-[2rem] leading-none mb-5 text-[#514228] whitespace-pre-line break-words"
              style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
            >
              {cfg.subtitle || '\u00A0'}
            </h2>
            {/* Paragraphs */}
            <div className="space-y-3 mb-6">
              {cfg.paragraphs.filter(Boolean).map((p, i) => (
                <p
                  key={i}
                  className="text-[#555] text-sm sm:text-base leading-relaxed text-center lg:text-justify break-words whitespace-pre-line"
                  style={{ fontFamily: "'Aristotelica Pro Text', sans-serif" }}
                >
                  {p}
                </p>
              ))}
            </div>
            {/* CTA */}
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <a
                href="#contato"
                onClick={e => e.preventDefault()}
                className="border-[2px] bg-gold border-gold/80 text-white text-base sm:text-[1.5rem] px-[8px] py-[5px] rounded-[11px] transition-all duration-300"
                style={{
                  backgroundImage: noiseBg,
                  backgroundSize: '200px 200px',
                }}
              >
                {cfg.buttonText || sobreNosDefaults.buttonText}
              </a>
              <a
                href="#contato"
                onClick={e => e.preventDefault()}
                className="border-[2px] border-[#514228] text-[#514228] p-[7px] rounded-[12px] transition-all duration-300 flex items-center justify-center"
              >
                <ArrowRight size={20} />
              </a>
            </div>
          </div>

          {/* Image grid — order-1 on mobile, order-2 on lg */}
          <div className="order-1 lg:order-2">
            <div className="rounded-[2rem] p-2">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: '3fr 2fr',
                  gridTemplateRows: '3fr 2fr',
                  height: 'clamp(220px, 28vw, 400px)',
                }}
              >
                {imgs.map((src, i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl bg-[#E8E0D4]">
                    {src ? (
                      <img
                        src={src}
                        alt={`Imagem ${i + 1}`}
                        className="w-full h-full object-cover"
                        style={i === 1 ? { objectPosition: 'top' } : undefined}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={20} className="text-[#f5c518]/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const imageSlotLabels = [
    'Superior esq. (grande)',
    'Superior dir.',
    'Inferior esq.',
    'Inferior dir.',
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sobre nós</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Edite o conteúdo da seção "Sobre nós" do site
        </p>
        {loading && <p className="text-xs text-gray-400 mt-2">Carregando dados da API...</p>}
      </div>

      <section className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f5c518]/10 flex items-center justify-center">
              <BookOpen size={16} className="text-[#f5c518]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Sobre nós</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Imagens, subtítulo e parágrafos</p>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={openEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Pencil size={15} />
              Editar
            </button>
          )}
        </div>

        {/* ── VIEW MODE ── */}
        {!editing && (
          <div className="p-4">
            {renderPreview(config, resolvedImages)}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editing && (
          <div className="p-6 space-y-6">

            {/* 4-image grid upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imagens <span className="text-gray-400 font-normal">(grade 2×2 assimétrica)</span>
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                Recomendado: até <span className="font-medium">1200 × 800 px</span> · JPG, PNG ou WebP · máx. <span className="font-medium">5 MB</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([0, 1, 2, 3] as const).map(idx => {
                  const src = resolvedDraftImages[idx]
                  const isUploading = uploadingIdx === idx
                  return (
                    <div key={idx}>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{imageSlotLabels[idx]}</p>
                      <div
                        onClick={() => !isUploading && uploadingIdx === null && fileInputRefs.current[idx]?.click()}
                        className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#f5c518] transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${src ? 'p-1' : 'p-5'}`}
                      >
                        {isUploading ? (
                          <div className="py-4 flex flex-col items-center gap-1">
                            <Image size={24} className="text-gray-400 animate-pulse" />
                            <span className="text-xs text-gray-500">Enviando...</span>
                          </div>
                        ) : src ? (
                          <>
                            <img src={src} alt={`Imagem ${idx + 1}`} className="w-full aspect-video object-cover rounded-lg" />
                            <span className="text-xs text-gray-400 py-1">Clique para alterar</span>
                          </>
                        ) : (
                          <>
                            <Image size={24} className="text-gray-400" />
                            <span className="text-xs text-gray-500 text-center">Enviar imagem</span>
                            <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                          </>
                        )}
                        <input
                          ref={el => { fileInputRefs.current[idx] = el }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          onChange={e => handleImageUpload(idx, e)}
                          className="hidden"
                        />
                      </div>
                      {draft.images[idx] && draft.images[idx] !== defaultImages[idx] && (
                        <button
                          type="button"
                          onClick={() => setDraft(prev => {
                            const images = [...prev.images]
                            images[idx] = defaultImages[idx]
                            return { ...prev, images }
                          })}
                          className="mt-1 text-xs text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer"
                        >
                          Restaurar padrão
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subtítulo <span className="text-gray-400 font-normal">(Enter = nova linha)</span>
              </label>
              <textarea
                value={draft.subtitle}
                onChange={e => setDraft(prev => ({ ...prev, subtitle: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent resize-none"
                placeholder={'Ex: Qualidade e segurança\nem um único lugar!'}
              />
            </div>

            {/* Button text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Texto do botão
              </label>
              <input
                type="text"
                value={draft.buttonText}
                onChange={e => setDraft(prev => ({ ...prev, buttonText: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
                placeholder="Ex: Entre em contato"
              />
            </div>

            {/* Paragraphs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Parágrafos</label>
              <div className="space-y-3">
                {draft.paragraphs.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <textarea
                      value={p}
                      onChange={e => updateParagraph(i, e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent resize-none"
                      placeholder={`Parágrafo ${i + 1}`}
                    />
                    {draft.paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParagraph(i)}
                        className="mt-1 p-2 rounded-lg hover:bg-[#f5c518]/10 text-[#f5c518] transition-colors cursor-pointer flex-shrink-0"
                        title="Remover parágrafo"
                        aria-label="Remover parágrafo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addParagraph}
                className="mt-3 text-sm text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer font-medium"
              >
                + Adicionar parágrafo
              </button>
            </div>

            {/* Live Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Prévia em tempo real
              </label>
              {renderPreview(draft, resolvedDraftImages)}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploadingIdx !== null}
                className="flex items-center gap-2 px-6 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}


