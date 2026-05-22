import { useState, useRef, useEffect } from 'react'
import { Pencil, Layers, Save, Image, ToggleRight, ToggleLeft, AlertTriangle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { AutoResizeInput } from '../../components/admin/AutoResizeInput'
import { uploadService } from '../../services/upload.service'
import { homeService } from '../../services/home.service'
import { resolveImageUrl } from '../../services/api'
import OptimizedImage from '../../components/shared/OptimizedImage'

interface HeroConfig {
  title1: string
  title2: string
  subtitle: string
  buttonText: string
  backgroundImage: string
}

const heroDefaults: HeroConfig = {
  title1: 'A sua melhor versÃ£o',
  title2: 'COMEÃ‡A AQUI!',
  subtitle: 'RealÃ§o sua beleza Ãºnica atravÃ©s da cirurgia plÃ¡stica, utilizando tecnologias modernas e um cuidado especial no pÃ³s-operatÃ³rio.',
  buttonText: 'Entre em contato',
  backgroundImage: '',
}

interface Banner {
  id: string
  title: string
  imageUrl: string
  link: string
  active: boolean
  order: number
}

interface BannerModalProps {
  banner?: Banner | null
  onClose: () => void
  onSave: (data: Omit<Banner, 'id'>) => void
}

function BannerModal({ banner, onClose, onSave }: BannerModalProps) {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [link, setLink] = useState(banner?.link ?? '')
  const [active, setActive] = useState(banner?.active ?? true)
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, 'banners')
      setImageUrl(result.url)
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer upload da imagem'
      toast.error(`Erro ao fazer upload: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ title, imageUrl, link, active, order: banner?.order ?? 0 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {banner ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
          >
            âœ•
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Upload de imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagem do Banner
            </label>
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#f5c518] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? (
                <>
                  <Image size={32} className="text-gray-400 animate-pulse" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Fazendo upload...</span>
                </>
              ) : imageUrl ? (
                <div className="w-full">
                  <OptimizedImage src={imageUrl} alt="Preview" sizes="320px" className="w-full h-48 object-cover rounded-lg mb-2" />
                  <span className="text-xs text-gray-400">Clique para alterar</span>
                </div>
              ) : (
                <>
                  <Image size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Clique para enviar ou arraste a imagem</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP atÃ© 5MB</span>
                  <span className="text-xs text-amber-500 font-medium">Tamanho recomendado: 2000 Ã— 562 px</span>
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
              />
            </div>
          </div>

          {/* TÃ­tulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              TÃ­tulo
            </label>
            <AutoResizeInput
              
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
              placeholder="Ex: PromoÃ§Ã£o de VerÃ£o"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link (URL de destino)
            </label>
            <AutoResizeInput
              
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
              placeholder="Ex: /promocoes"
            />
            {link && !/^\/[^\\/]/.test(link) && !/^https:\/\//.test(link) && (
              <p className="mt-1 text-xs text-red-500">Use um caminho relativo (ex: /promocoes) ou URL com https://</p>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Banner ativo</span>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className="cursor-pointer"
            >
              {active
                ? <ToggleRight size={32} className="text-[#f5c518]" />
                : <ToggleLeft size={32} className="text-gray-400" />
              }
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-[#f5c518] text-[#0A0A0A] text-sm font-medium hover:bg-[#D4AA52] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps {
  bannerTitle: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteModal({ bannerTitle, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Excluir banner</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tem certeza que deseja excluir <span className="font-medium text-gray-700 dark:text-gray-200">"{bannerTitle}"</span>? Esta aÃ§Ã£o nÃ£o pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium transition-colors cursor-pointer"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Hero Section Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroEditor() {
  const [config, setConfig] = useState<HeroConfig>(heroDefaults)
  const [draft, setDraft] = useState<HeroConfig>(heroDefaults)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadHome = async () => {
      try {
        setLoading(true)
        const data = await homeService.getPublic()
        if (!data) return

        const merged: HeroConfig = {
          title1: (data.titulo_1 ?? heroDefaults.title1).replace(/[\r\n]+/g, ' ').trim(),
          title2: (data.titulo_2 ?? heroDefaults.title2).replace(/[\r\n]+/g, ' ').trim(),
          subtitle: data.subtitulo ?? heroDefaults.subtitle,
          buttonText: data.texto_botao ?? heroDefaults.buttonText,
          backgroundImage: data.imagem ?? heroDefaults.backgroundImage,
        }

        setConfig(merged)
        setDraft(merged)
      } catch (error) {
        console.error('Erro ao carregar Home:', error)
        toast.error('Nao foi possivel carregar os dados da Home')
      } finally {
        setLoading(false)
      }

    }

    loadHome()
  }, [])

  const openEdit = () => {
    setDraft({ ...config })
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft({ ...config })
    setEditing(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, 'banners')
      setDraft(prev => ({ ...prev, backgroundImage: result.url }))
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao enviar imagem do Hero'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (draft.title1.trim().length < 3) {
      toast.error('TÃ­tulo principal deve ter no mÃ­nimo 3 caracteres')
      return
    }

    setSaving(true)
    try {
      const data = await homeService.update({
        titulo_1: draft.title1.replace(/[\r\n]+/g, ' ').trim(),
        titulo_2: (draft.title2.replace(/[\r\n]+/g, ' ').trim()) || null,
        subtitulo: draft.subtitle.trim() || null,
        texto_botao: draft.buttonText.trim() || null,
        imagem: draft.backgroundImage || null,
      })

      const updated: HeroConfig = {
        title1: data.titulo_1 ?? heroDefaults.title1,
        title2: data.titulo_2 ?? heroDefaults.title2,
        subtitle: data.subtitulo ?? heroDefaults.subtitle,
        buttonText: data.texto_botao ?? heroDefaults.buttonText,
        backgroundImage: data.imagem ?? heroDefaults.backgroundImage,
      }

      setConfig(updated)
      setDraft(updated)
      setEditing(false)
      toast.success('ConfiguraÃ§Ãµes do hero salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar Home:', error)
      toast.error('Erro ao salvar configuraÃ§Ãµes')
    } finally {
      setSaving(false)
    }
  }

  const previewBg = config.backgroundImage ? resolveImageUrl(config.backgroundImage) : '/bannerHome.png'
  const draftBg = draft.backgroundImage ? resolveImageUrl(draft.backgroundImage) : '/bannerHome.png'

  // Preserve original whitespace/newlines â€” match everything up to the last non-space word
  const title1Match = config.title1.match(/^([\s\S]*?)(\S+)\s*$/)
  const title1Normal = title1Match?.[1] ?? ''
  const title1Bold   = title1Match?.[2] ?? config.title1

  const draftTitle1Match = draft.title1.match(/^([\s\S]*?)(\S+)\s*$/)
  const draftTitle1Normal = draftTitle1Match?.[1] ?? ''
  const draftTitle1Bold   = draftTitle1Match?.[2] ?? draft.title1

  return (
    <section className="mb-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {loading && (
        <div className="px-6 pt-4 text-xs text-gray-500 dark:text-gray-400">Carregando dados da Home pela API...</div>
      )}
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f5c518]/10 flex items-center justify-center">
            <Layers size={16} className="text-[#f5c518]" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Hero Principal</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">TÃ­tulo, subtÃ­tulo, botÃ£o e imagem de fundo</p>
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

      {/* â”€â”€ VIEW MODE â”€â”€ */}
      {!editing && (
        <div className="m-4 admin-preview-surface rounded-xl overflow-hidden border border-[#f5c518]/20">
          {/* Mobile preview: espelha a seÃ§Ã£o Hero do site */}
          <div
            className="sm:hidden relative w-full min-h-[calc(100vh-220px)] overflow-hidden"
            style={{
              backgroundImage: `url(${previewBg})`,
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 w-full relative z-20 pt-12 pb-16 min-h-[calc(100vh-220px)] flex items-center">
              <div className="flex flex-col justify-center items-center text-center">
                <p
                  className="text-white text-[1.5rem] font-light mb-1 leading-snug whitespace-pre-line"
                  style={{ fontFamily: "'Aristotelica Pro Text', sans-serif" }}
                >
                  {title1Normal && <>{title1Normal} </>}
                  <strong className="font-bold">{title1Bold}</strong>
                </p>
                <h1
                  className="text-[3.5rem] font-bold leading-none uppercase tracking-tight mb-6 bg-gradient-to-b from-[#E8C96A] via-[#f5c518] to-[#8B6914] bg-clip-text text-transparent whitespace-pre-line"
                  style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
                >
                  {config.title2 || '\u00A0'}
                </h1>
                {config.subtitle && (
                  <p
                    className="text-white/80 text-base leading-relaxed max-w-[37rem] mb-8 whitespace-pre-line"
                    style={{ fontFamily: "'Aristotelica Pro Text', sans-serif" }}
                  >
                    {config.subtitle}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <a
                    href="#contato"
                    className="border-[2px] border-gold/80 text-white text-base px-[8px] py-[5px] rounded-[11px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300"
                    style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
                  >
                    {config.buttonText}
                  </a>
                  <a
                    href="#contato"
                    className="border-[2px] border-gold/80 text-white p-[7px] rounded-[12px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300 flex items-center justify-center"
                  >
                    <ArrowRight size={20} />
                  </a>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f5c518] to-transparent" />
          </div>

          <div
            className="hidden sm:block relative w-full aspect-[16/9] overflow-hidden"
            style={{
              backgroundImage: `url(${previewBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center px-[6%]">
              <p className="text-white font-light mb-1 leading-snug break-words" style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)', fontFamily: "'Aristotelica Pro Text', sans-serif" }}>
                {title1Normal && <>{title1Normal} </>}
                <strong className="font-bold">{title1Bold}</strong>
              </p>
              <h1
                className="font-bold leading-none uppercase tracking-tight mb-4 bg-gradient-to-b from-[#E8C96A] via-[#f5c518] to-[#8B6914] bg-clip-text text-transparent break-words"
                style={{ fontSize: 'clamp(2rem, 6vw, 6rem)', fontFamily: "'Aristotelica Pro Display', sans-serif" }}
              >
                {config.title2 || '\u00A0'}
              </h1>
              {config.subtitle && (
                <p className="text-white/80 leading-relaxed max-w-[37rem] mb-6 break-words" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.5rem)', fontFamily: "'Aristotelica Pro Text', sans-serif", whiteSpace: 'pre-line' }}>
                  {config.subtitle}
                </p>
              )}
              <div className="flex items-center gap-2">
                <a href="#contato" className="border-[2px] border-gold/80 text-white text-base sm:text-[1.5rem] px-[8px] py-[5px] rounded-[11px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300" style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}>
                  {config.buttonText}
                </a>
                <a href="#contato" className="border-[2px] border-gold/80 text-white p-[7px] rounded-[12px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300 flex items-center justify-center">
                  <ArrowRight size={20} />
                </a>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f5c518] to-transparent" />
          </div>
        </div>
      )}

      {/* â”€â”€ EDIT MODE â”€â”€ */}
      {editing && (
        <div className="p-6 space-y-5">
          {/* Background Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagem de Fundo
            </label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#f5c518] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''} ${draftBg ? 'p-2' : 'p-8'}`}
            >
              {uploading ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <Image size={32} className="text-gray-400 animate-pulse" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Carregando imagem...</span>
                </div>
              ) : draftBg ? (
                <div className="w-full">
                  <OptimizedImage src={draftBg} alt="Preview fundo" sizes="320px" className="w-full h-48 object-cover rounded-lg mb-2" />
                  <span className="text-xs text-gray-400 text-center block">Clique para alterar</span>
                </div>
              ) : (
                <>
                  <Image size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Clique para enviar a imagem de fundo</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                  <span className="text-xs text-amber-500 font-medium">Tamanho recomendado: 1920 Ã— 1080 px</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {draft.backgroundImage && (
                <button
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, backgroundImage: '' }))}
                  className="text-xs text-[#f5c518] hover:text-[#D4AA52] transition-colors cursor-pointer"
                >
                  Remover imagem (usar imagem padrÃ£o)
                </button>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Recomendado: <span className="font-medium">1920 Ã— 1080 px</span> Â· JPG, PNG ou WebP Â· mÃ¡x. <span className="font-medium">5 MB</span>
              </span>
            </div>
          </div>

          {/* Pre-title field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PrÃ©-tÃ­tulo <span className="text-gray-400 font-normal">(Ãºltima palavra em negrito)</span>
            </label>
            <AutoResizeInput
              value={draft.title1}
              onChange={e => setDraft(prev => ({ ...prev, title1: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
              placeholder="Ex: A sua melhor versÃ£o"
            />
          </div>

          {/* Main headline field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              TÃ­tulo principal <span className="text-gray-400 font-normal">(gradiente dourado, maiÃºsculas)</span>
            </label>
            <AutoResizeInput
              value={draft.title2}
              onChange={e => setDraft(prev => ({ ...prev, title2: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
              placeholder="Ex: COMEÃ‡A AQUI!"
            />
          </div>

          {/* Subtitle field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SubtÃ­tulo <span className="text-gray-400 font-normal">(texto branco abaixo do tÃ­tulo)</span>
            </label>
            <textarea
              value={draft.subtitle}
              onChange={e => setDraft(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent resize-none"
              placeholder="Texto exibido abaixo do tÃ­tulo principal"
            />
          </div>

          {/* Button text field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texto do botÃ£o CTA
            </label>
            <AutoResizeInput
              value={draft.buttonText}
              onChange={e => setDraft(prev => ({ ...prev, buttonText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent"
              placeholder="Ex: Entre em contato"
            />
          </div>

          {/* Live Preview */}
          <div className="admin-preview-surface rounded-xl overflow-hidden border border-[#f5c518]/20">
            <div className="bg-[#FAF7F2] dark:bg-[#111111] px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-[#f5c518]/15">
              PrÃ©-visualizaÃ§Ã£o em tempo real
            </div>

            <div
              className="sm:hidden relative w-full min-h-[420px] overflow-hidden"
              style={{
                backgroundImage: `url(${draftBg})`,
                backgroundSize: 'cover',
              }}
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="max-w-7xl mx-auto px-4 w-full relative z-20 pt-12 pb-16 min-h-[420px] flex items-center">
                <div className="flex flex-col justify-center items-center text-center">
                  <p
                    className="text-white text-[1.5rem] font-light mb-1 leading-snug whitespace-pre-line"
                    style={{ fontFamily: "'Aristotelica Pro Text', sans-serif" }}
                  >
                    {draftTitle1Normal && <>{draftTitle1Normal} </>}
                    <strong className="font-bold">{draftTitle1Bold}</strong>
                  </p>
                  <h1
                    className="text-[3.5rem] font-bold leading-none uppercase tracking-tight mb-6 bg-gradient-to-b from-[#E8C96A] via-[#f5c518] to-[#8B6914] bg-clip-text text-transparent whitespace-pre-line"
                    style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
                  >
                    {draft.title2 || '\u00A0'}
                  </h1>
                  {draft.subtitle && (
                    <p
                      className="text-white/80 text-base leading-relaxed max-w-[37rem] mb-8 whitespace-pre-line"
                      style={{ fontFamily: "'Aristotelica Pro Text', sans-serif" }}
                    >
                      {draft.subtitle}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <a
                      href="#contato"
                      className="border-[2px] border-gold/80 text-white text-base px-[8px] py-[5px] rounded-[11px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300"
                      style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}
                    >
                      {draft.buttonText}
                    </a>
                    <a
                      href="#contato"
                      className="border-[2px] border-gold/80 text-white p-[7px] rounded-[12px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300 flex items-center justify-center"
                    >
                      <ArrowRight size={20} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f5c518] to-transparent" />
            </div>

            <div
              className="hidden sm:block relative w-full aspect-[16/9] overflow-hidden"
              style={{
                backgroundImage: `url(${draftBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-center px-[6%]">
                <p className="text-white font-light mb-1 leading-snug break-words" style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)', fontFamily: "'Aristotelica Pro Text', sans-serif" }}>
                  {draftTitle1Normal && <>{draftTitle1Normal} </>}
                  <strong className="font-bold">{draftTitle1Bold}</strong>
                </p>
                <h1
                  className="font-bold leading-none uppercase tracking-tight mb-4 bg-gradient-to-b from-[#E8C96A] via-[#f5c518] to-[#8B6914] bg-clip-text text-transparent break-words"
                  style={{ fontSize: 'clamp(2rem, 6vw, 6rem)', fontFamily: "'Aristotelica Pro Display', sans-serif" }}
                >
                  {draft.title2 || '\u00A0'}
                </h1>
                {draft.subtitle && (
                  <p className="text-white/80 leading-relaxed max-w-[37rem] mb-6 break-words" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.5rem)', fontFamily: "'Aristotelica Pro Text', sans-serif", whiteSpace: 'pre-line' }}>
                    {draft.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <a href="#contato" className="border-[2px] border-gold/80 text-white text-base sm:text-[1.5rem] px-[8px] py-[5px] rounded-[11px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300" style={{ fontFamily: "'Aristotelica Pro Display', sans-serif" }}>
                    {draft.buttonText}
                  </a>
                  <a href="#contato" className="border-[2px] border-gold/80 text-white p-[7px] rounded-[12px] hover:border-gold hover:shadow-[0_0_10px_rgba(245, 197, 24,0.25)] transition-all duration-300 flex items-center justify-center">
                    <ArrowRight size={20} />
                  </a>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f5c518] to-transparent" />
            </div>
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
              disabled={saving || uploading}
              className="flex items-center gap-2 px-6 py-2 bg-[#f5c518] hover:bg-[#D4AA52] text-[#0A0A0A] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Hero'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
export default function BannersHome() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Home</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure o conteÃºdo exibido na pÃ¡gina inicial
        </p>
      </div>

      {/* Hero Editor */}
      <HeroEditor />
    </div>
  )
}




