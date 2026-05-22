import { useState, useRef, useEffect } from 'react'
import { Image, Layers, Pencil, Save, ShoppingCart, X } from 'lucide-react'
import { toast } from 'sonner'
import { heroService, HERO_DEFAULTS, type HeroBannerContent } from '../../services/hero.service'
import { blogBannerService, BLOG_BANNER_DEFAULTS, type BlogBannerContent } from '../../services/blog-banner.service'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'

function HeroPreview({ data, bgUrl }: { data: HeroBannerContent; bgUrl: string }) {
  return (
    <section className="relative min-h-[520px] w-full max-w-full overflow-hidden bg-gray-900 text-white sm:min-h-105">
      <img
        src={bgUrl}
        alt="Preview do banner"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-100"
      />
      <div className="relative max-w-8xl mx-auto px-4 pt-14 pb-10 flex flex-col items-center text-center justify-center min-h-[440px] sm:items-start sm:text-left sm:pt-20 sm:pb-15 sm:min-h-105">
        <h1 className="text-[32px] font-bold uppercase leading-none text-white mb-2 sm:text-[50px] sm:leading-[0.95] sm:mb-3">
          {data.titulo_1 || <span className="opacity-30">Linha 1</span>}
        </h1>
        <h1 className="text-[36px] font-bold uppercase leading-none mb-2 text-[#F5C518] sm:text-[55px] sm:leading-[0.95] sm:mb-3">
          {data.titulo_2 || <span className="opacity-30">Linha 2</span>}
        </h1>
        <h2 className="text-[34px] font-bold uppercase leading-none text-white mb-5 sm:text-[55px] sm:leading-[0.95]">
          {data.titulo_3 || <span className="opacity-30">Linha 3</span>}
        </h2>
        <p className="whitespace-pre-line text-gray-200 text-[15px] max-w-md mb-7 sm:text-[17px] sm:text-gray-300 sm:mb-8">
          {data.subtitulo}
        </p>
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:w-auto">
          <span className="flex items-center justify-center gap-2 bg-[#F5C518] text-black font-bold px-6 py-3 rounded-[7px] text-[15px]">
            <ShoppingCart size={16} />
            {data.cta_1 || 'Ver produtos'}
          </span>
          <span className="flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-6 py-3 rounded-[7px] text-[15px]">
            {data.cta_2 || 'Falar com especialista'}
          </span>
        </div>
      </div>
    </section>
  )
}

function HeroBannerEditor() {
  const [saved, setSaved] = useState<HeroBannerContent>(HERO_DEFAULTS)
  const [draft, setDraft] = useState<HeroBannerContent>(HERO_DEFAULTS)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    heroService
      .getPublic()
      .then((data) => {
        setSaved(data)
        setDraft(data)
      })
      .catch(() => toast.error('Não foi possível carregar os dados do hero'))
      .finally(() => setLoading(false))
  }, [])

  function openEdit() {
    setDraft({ ...saved })
    setEditing(true)
  }

  function cancelEdit() {
    setDraft({ ...saved })
    setEditing(false)
  }

  function update(field: keyof HeroBannerContent, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, 'banners', { maxWidth: 1920 })
      setDraft((prev) => ({ ...prev, imagem: result.url }))
      toast.success('Imagem enviada com sucesso')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar imagem'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!draft.titulo_1.trim()) {
      toast.error('O campo Linha 1 não pode estar vazio')
      return
    }
    setSaving(true)
    try {
      const updated = await heroService.update(draft)
      setSaved(updated)
      setDraft(updated)
      setEditing(false)
      toast.success('Hero salvo com sucesso!')
    } catch {
      toast.error('Erro ao salvar o hero')
    } finally {
      setSaving(false)
    }
  }

  const previewBg = saved.imagem ? resolveImageUrl(saved.imagem) : '/assets/banner-hometp.png'
  const draftBg = draft.imagem ? resolveImageUrl(draft.imagem) : '/assets/banner-hometp.png'

  return (
    <div>
      

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading && (
          <div className="px-6 py-4 text-sm text-gray-400 animate-pulse">Carregando...</div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5c518]/10">
              <Layers size={16} className="text-[#f5c518]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Hero Principal</p>
              <p className="text-xs text-gray-400">Títulos, subtítulo, botões e imagem de fundo</p>
            </div>
          </div>
          {!editing && !loading && (
            <button
              type="button"
              onClick={openEdit}
              className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-4 py-2 text-sm font-medium text-black hover:bg-[#e6b800] transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Editar
            </button>
          )}
        </div>

        {/* View mode */}
        {!editing && !loading && (
          <div className="m-4 overflow-hidden rounded-xl border border-gray-200">
            <HeroPreview data={saved} bgUrl={previewBg} />
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="p-6 space-y-5">
            {/* Image upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Imagem de fundo
              </label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-[#f5c518] ${uploading ? 'pointer-events-none opacity-50' : ''} ${draft.imagem ? 'p-2' : 'p-8'}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Image size={28} className="animate-pulse text-gray-400" />
                    <span className="text-sm text-gray-500">Enviando imagem...</span>
                  </div>
                ) : draft.imagem ? (
                  <div className="w-full">
                    <img
                      src={draftBg}
                      alt="Preview"
                      className="mb-1 h-40 w-full rounded-lg object-cover"
                    />
                    <span className="block text-center text-xs text-gray-400">
                      Clique para alterar
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Image size={28} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Clique para enviar a imagem de fundo
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG ou WebP · máx. 5 MB</span>
                    <span className="text-xs font-medium text-amber-500">
                      Recomendado: 1920 × 520 px
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {draft.imagem && (
                <button
                  type="button"
                  onClick={() => update('imagem', '')}
                  className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X size={12} />
                  Remover imagem (usar padrão)
                </button>
              )}
            </div>

            {/* Text fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Linha 1 <span className="font-normal text-gray-400">(branco)</span>
                </label>
                <input
                  type="text"
                  value={draft.titulo_1}
                  onChange={(e) => update('titulo_1', e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
                  placeholder="ESPECIALISTAS EM"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Linha 2 <span className="font-normal text-gray-400">(amarelo)</span>
                </label>
                <input
                  type="text"
                  value={draft.titulo_2}
                  onChange={(e) => update('titulo_2', e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
                  placeholder="SINALIZAÇÃO VIÁRIA"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Linha 3 <span className="font-normal text-gray-400">(branco)</span>
                </label>
                <input
                  type="text"
                  value={draft.titulo_3}
                  onChange={(e) => update('titulo_3', e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
                  placeholder="PARA TODO O BRASIL"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subtítulo</label>
              <textarea
                value={draft.subtitulo}
                onChange={(e) => update('subtitulo', e.target.value)}
                
                rows={4}
                className="block min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
                placeholder="Texto descritivo abaixo dos títulos"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Botão 1 <span className="font-normal text-gray-400">(amarelo — link para produtos)</span>
                </label>
                <input
                  type="text"
                  value={draft.cta_1}
                  onChange={(e) => update('cta_1', e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
                  placeholder="Ver produtos"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Botão 2 <span className="font-normal text-gray-400">(borda branca — link para WhatsApp)</span>
                </label>
                <input
                  type="text"
                  value={draft.cta_2}
                  onChange={(e) => update('cta_2', e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
                  placeholder="Falar com especialista"
                />
              </div>
            </div>

            {/* Live preview */}
            <div className="overflow-hidden rounded-xl border border-[#f5c518]/20">
              <div className="border-b border-[#f5c518]/10 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                Pré-visualização em tempo real
              </div>
              <HeroPreview data={draft} bgUrl={draftBg} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-6 py-2 text-sm font-medium text-black hover:bg-[#e6b800] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Blog Banner Editor ─────────────────────────────────────────────────────────

function BlogBannerPreview({ data, bgUrl }: { data: BlogBannerContent; bgUrl: string }) {
  return (
    <section
      className="relative overflow-hidden bg-gray-950 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/15" />
      <div className="relative mx-auto max-w-8xl px-3 py-10 text-white min-[360px]:px-4 min-[360px]:py-14 md:py-17">
        <p className="text-[12px] font-black uppercase text-[#F5C518]" style={{ fontWeight: 'bold' }}>
          {data.supertitulo || <span className="opacity-30">Supertítulo</span>}
        </p>
        <h1
          className="mt-3 max-w-lg text-[29px] font-black leading-[1.05] min-[360px]:text-[34px] md:text-[44px]"
          style={{ fontWeight: 'bold' }}
        >
          {data.titulo || <span className="opacity-30">Título</span>}
        </h1>
        <p className="mt-4 max-w-lg whitespace-pre-line text-[15px] leading-6 text-white">
          {data.descricao}
        </p>
      </div>
    </section>
  )
}

function BlogBannerEditor() {
  const [saved, setSaved] = useState<BlogBannerContent>(BLOG_BANNER_DEFAULTS)
  const [draft, setDraft] = useState<BlogBannerContent>(BLOG_BANNER_DEFAULTS)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    blogBannerService
      .getPublic()
      .then((data) => { setSaved(data); setDraft(data) })
      .catch(() => toast.error('Não foi possível carregar os dados do banner do blog'))
      .finally(() => setLoading(false))
  }, [])

  function openEdit() { setDraft({ ...saved }); setEditing(true) }
  function cancelEdit() { setDraft({ ...saved }); setEditing(false) }
  function update(field: keyof BlogBannerContent, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadService.uploadImage(file, 'banners', { maxWidth: 1920 })
      setDraft((prev) => ({ ...prev, imagem: result.url }))
      toast.success('Imagem enviada com sucesso')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!draft.titulo.trim()) { toast.error('O título não pode estar vazio'); return }
    setSaving(true)
    try {
      const updated = await blogBannerService.update(draft)
      setSaved(updated); setDraft(updated); setEditing(false)
      toast.success('Banner do blog salvo com sucesso!')
    } catch {
      toast.error('Erro ao salvar o banner do blog')
    } finally {
      setSaving(false)
    }
  }

  const defaultBg = '/assets/banner-hometp.png'
  const previewBg = saved.imagem ? resolveImageUrl(saved.imagem) : defaultBg
  const draftBg = draft.imagem ? resolveImageUrl(draft.imagem) : defaultBg

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {loading && (
        <div className="px-6 py-4 text-sm text-gray-400 animate-pulse">Carregando...</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5c518]/10">
            <Layers size={16} className="text-[#f5c518]" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Banner do Blog</p>
            <p className="text-xs text-gray-400">Supertítulo, título, descrição e imagem de fundo</p>
          </div>
        </div>
        {!editing && !loading && (
          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-4 py-2 text-sm font-medium text-black hover:bg-[#e6b800] transition-colors cursor-pointer"
          >
            <Pencil size={14} />
            Editar
          </button>
        )}
      </div>

      {/* View mode */}
      {!editing && !loading && (
        <div className="m-4 overflow-hidden rounded-xl border border-gray-200">
          <BlogBannerPreview data={saved} bgUrl={previewBg} />
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="p-6 space-y-5">
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Imagem de fundo</label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-[#f5c518] ${uploading ? 'pointer-events-none opacity-50' : ''} ${draft.imagem ? 'p-2' : 'p-8'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Image size={28} className="animate-pulse text-gray-400" />
                  <span className="text-sm text-gray-500">Enviando imagem...</span>
                </div>
              ) : draft.imagem ? (
                <div className="w-full">
                  <img src={draftBg} alt="Preview" className="mb-1 h-40 w-full rounded-lg object-cover" />
                  <span className="block text-center text-xs text-gray-400">Clique para alterar</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Image size={28} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Clique para enviar a imagem de fundo</span>
                  <span className="text-xs text-gray-400">PNG, JPG ou WebP · máx. 5 MB</span>
                  <span className="text-xs font-medium text-amber-500">Recomendado: 1920 × 400 px</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            {draft.imagem && (
              <button
                type="button"
                onClick={() => update('imagem', '')}
                className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={12} />
                Remover imagem (usar padrão)
              </button>
            )}
          </div>

          {/* Text fields */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Supertítulo <span className="font-normal text-gray-400">(texto amarelo pequeno)</span>
            </label>
            <input
              type="text"
              value={draft.supertitulo}
              onChange={(e) => update('supertitulo', e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
              placeholder="Conteúdo técnico"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={draft.titulo}
              onChange={(e) => update('titulo', e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518]"
              placeholder="Conteúdo técnico e orientações"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={draft.descricao}
              onChange={(e) => update('descricao', e.target.value)}
              rows={4}
              className="block min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
              placeholder="Texto descritivo abaixo do título"
            />
          </div>

          {/* Live preview */}
          <div className="overflow-hidden rounded-xl border border-[#f5c518]/20">
            <div className="border-b border-[#f5c518]/10 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
              Pré-visualização em tempo real
            </div>
            <BlogBannerPreview data={draft} bgUrl={draftBg} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-6 py-2 text-sm font-medium text-black hover:bg-[#e6b800] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type HeroEditorProps = {
  section?: 'all' | 'hero' | 'blog'
}

export default function HeroEditor({ section = 'all' }: HeroEditorProps) {
  const isHeroOnly = section === 'hero'
  const isBlogOnly = section === 'blog'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isHeroOnly ? 'Hero Principal' : isBlogOnly ? 'Banner do Blog' : 'Hero / Banner'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Edite os textos, botões e imagens de fundo exibidos nas páginas do site.
        </p>
      </div>
      <div className="space-y-6">
        {!isBlogOnly && <HeroBannerEditor />}
        {!isHeroOnly && <BlogBannerEditor />}
      </div>
    </div>
  )
}
