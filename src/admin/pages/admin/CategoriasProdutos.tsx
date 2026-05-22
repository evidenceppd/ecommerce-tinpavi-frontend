import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { categoriaProdutoService, type CategoriaProduto } from '../../services/categoriaProduto.service'
import { Edit3, FolderTree, ImagePlus, Plus, Trash2, Upload } from 'lucide-react'
import { Select } from '../../components/shared/Select'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'

export default function CategoriasProdutos() {
  const [items, setItems] = useState<CategoriaProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadingModalImage, setUploadingModalImage] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoriaProduto | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name: '', slug: '', parentId: '', coverImage: '' })

  const openModal = () => {
    setEditingCategory(null)
    setForm({ name: '', slug: '', parentId: '', coverImage: '' })
    setIsCreateModalOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }

  const openEditModal = (category: CategoriaProduto) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      slug: category.slug || '',
      parentId: category.parentId || '',
      coverImage: category.coverImage || '',
    })
    setIsCreateModalOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }

  const closeModal = () => {
    setModalVisible(false)
    setTimeout(() => {
      setIsCreateModalOpen(false)
      setEditingCategory(null)
    }, 200)
  }

  const load = async () => {
    setLoading(true)
    try {
      const response = await categoriaProdutoService.list({ page: 1, limit: 100 })
      setItems(response.items)
    } catch {
      toast.error('Falha ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nameInputRef.current?.focus()

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isCreateModalOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        parentId: form.parentId || undefined,
        coverImage: form.coverImage || null,
      }

      if (editingCategory) {
        await categoriaProdutoService.update(editingCategory.id, payload)
        toast.success('Categoria atualizada')
      } else {
        await categoriaProdutoService.create(payload)
        toast.success('Categoria criada')
      }

      setForm({ name: '', slug: '', parentId: '', coverImage: '' })
      closeModal()
      await load()
    } catch {
      toast.error(editingCategory ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await categoriaProdutoService.remove(id)
      toast.success('Categoria desativada')
      await load()
    } catch {
      toast.error('Erro ao desativar categoria')
    }
  }

  const handleModalImageUpload = async (file?: File) => {
    if (!file) return
    setUploadingModalImage(true)
    try {
      const uploaded = await uploadService.uploadImage(file, 'categories')
      setForm((prev) => ({ ...prev, coverImage: uploaded.url }))
      toast.success('Imagem da categoria enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar imagem')
    } finally {
      setUploadingModalImage(false)
      if (modalFileInputRef.current) modalFileInputRef.current.value = ''
    }
  }

  const handleCardImageUpload = async (category: CategoriaProduto, file?: File) => {
    if (!file) return
    setUploadingId(category.id)
    try {
      const uploaded = await uploadService.uploadImage(file, 'categories')
      await categoriaProdutoService.update(category.id, { name: category.name, coverImage: uploaded.url })
      toast.success('Capa atualizada')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar capa')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Categorias de produtos</h2>
          <p className="text-sm text-slate-500">Organize navegação, filtros e agrupamentos.</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#f5c518] px-4 text-sm font-bold text-slate-950 hover:bg-[#e0b614] cursor-pointer"
        >
          <Plus size={16} />
          Nova categoria
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? <p>Carregando...</p> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {item.coverImage ? (
                        <img src={resolveImageUrl(item.coverImage)} alt={item.name} className="h-full w-full object-contain p-1.5" />
                      ) : (
                        <FolderTree size={22} className="text-[#c99b00]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-950">{item.name}</h3>
                      <p className="truncate text-xs text-slate-500">/{item.slug || 'sem-slug'}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Pai: <span className="font-semibold text-slate-700">{items.find((i) => i.id === item.parentId)?.name || 'Categoria principal'}</span>
                      </p>
                      <label className="mt-3 inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-[#f5c518] hover:text-slate-950">
                        <Upload size={14} />
                        {uploadingId === item.id ? 'Enviando...' : 'Alterar capa'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingId === item.id}
                          onChange={(event) => void handleCardImageUpload(item, event.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-[#f5c518]/15 hover:text-slate-950 cursor-pointer"
                      aria-label="Editar categoria"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => void handleDelete(item.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 cursor-pointer" aria-label="Excluir categoria">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen ? (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6 transition-all duration-200 ${modalVisible ? 'bg-black/50' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`w-full max-w-2xl bg-white rounded-xl shadow-xl p-4 sm:p-6 transition-all duration-200 ${modalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="categorias-modal-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="categorias-modal-title" className="text-lg font-semibold text-gray-800">
                {editingCategory ? 'Editar categoria' : 'Cadastrar categoria'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label="Fechar modal de cadastro de categoria"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-36">
                    {form.coverImage ? (
                      <img src={resolveImageUrl(form.coverImage)} alt="Capa da categoria" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImagePlus size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-950">Imagem de capa</p>
                    <p className="mt-1 text-xs text-slate-500">Use uma imagem limpa do produto principal da categoria.</p>
                    <p className="mt-0.5 text-xs text-slate-400">Tamanho recomendado: 400 × 400 px (máx. 2 MB)</p>
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => void handleModalImageUpload(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      disabled={uploadingModalImage}
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-[#f5c518] hover:text-slate-950 disabled:opacity-60 cursor-pointer"
                    >
                      <Upload size={14} />
                      {uploadingModalImage ? 'Enviando...' : 'Enviar imagem'}
                    </button>
                  </div>
                </div>
              </div>
              <input ref={nameInputRef} value={form.name} onChange={(e) => { const name = e.target.value; setForm((prev) => ({ ...prev, name, slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') })) }} required placeholder="Nome" className="border border-gray-200 rounded-lg px-3 py-2" />
              <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="slug-opcional" className="border border-gray-200 rounded-lg px-3 py-2" />
              <Select
                value={form.parentId}
                onChange={(val) => setForm((prev) => ({ ...prev, parentId: val }))}
                placeholder="Sem categoria pai"
                className="md:col-span-2"
                options={[
                  { value: '', label: 'Sem categoria pai' },
                  ...items.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
              <div className="flex gap-2 md:col-span-2 justify-end">
                <button type="button" onClick={closeModal} className="border border-gray-200 rounded-lg px-4 py-2 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="bg-[#f5c518] text-[#111] font-semibold rounded-lg px-4 py-2 cursor-pointer">
                  {editingCategory ? 'Salvar alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
