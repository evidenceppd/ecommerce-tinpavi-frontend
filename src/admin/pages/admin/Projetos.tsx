import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, ArrowLeft, ImageIcon, Upload, X, Calendar, Images, GripVertical } from 'lucide-react'
import { uploadService } from '../../services/upload.service'
import { projetoService } from '../../services/projeto.service'
import { resolveImageUrl } from '../../services/api'
import { toast } from 'sonner'
import { AutoResizeInput } from '../../components/admin/AutoResizeInput'
import OptimizedImage from '../../components/shared/OptimizedImage'
import { normalizeProjetoImagens, type ProjetoImagemGrupo } from '../../utils/projeto-imagens'

interface Projeto {
  id: number
  subtitulo: string
  titulo: string
  texto: string
  imagemCapa: string | null
  galeria: ProjetoImagemGrupo[]
  publicado: boolean
  ordem?: number
  createdAt: string
}

const sugestoesSubtitulo = ['Cozinhas', 'Closets', 'Quartos', 'Office', 'Salas']

interface ProjetoFormProps {
  projeto: Projeto | null
  onBack: () => void
  onSave: (data: Omit<Projeto, 'id' | 'createdAt'>) => Promise<void>
}

function ProjetoForm({ projeto, onBack, onSave }: ProjetoFormProps) {
  const [subtitulo, setSubtitulo] = useState(projeto?.subtitulo ?? sugestoesSubtitulo[0])
  const [titulo, setTitulo] = useState(projeto?.titulo ?? '')
  const [texto, setTexto] = useState(projeto?.texto ?? '')
  const [imagemCapa, setImagemCapa] = useState<string | null>(projeto?.imagemCapa ?? null)
  const [galeria, setGaleria] = useState<ProjetoImagemGrupo[]>(projeto?.galeria ?? [])
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingSubIndex, setUploadingSubIndex] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [draggedSubImage, setDraggedSubImage] = useState<{ groupIndex: number; subIndex: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const subInputsRef = useRef<Array<HTMLInputElement | null>>([])

  const isEdit = projeto !== null

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidFile = files.find((file) => !allowed.includes(file.type))
    if (invalidFile) {
      toast.error('Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF.')
      return
    }

    try {
      setUploadingImages(true)
      const uploaded = await Promise.all(files.map((file) => uploadService.uploadImage(file, 'projetos')))
      setGaleria((prev) => [...prev, ...uploaded.map((item) => ({ url: item.url, subImagens: [] }))])
    } catch (error) {
      console.error('Erro ao enviar imagens:', error)
      toast.error('Erro ao enviar imagens para a galeria')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    await uploadFiles(files)
  }

  const handleAddCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast.error('Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF.')
      if (coverInputRef.current) coverInputRef.current.value = ''
      return
    }

    try {
      setUploadingCover(true)
      const uploaded = await uploadService.uploadImage(file, 'projetos')
      setImagemCapa(uploaded.url)
      toast.success('Imagem de capa enviada com sucesso')
    } catch (error) {
      console.error('Erro ao enviar capa:', error)
      toast.error('Erro ao enviar imagem de capa')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files ?? [])
    await uploadFiles(files)
  }

  const handleAddSubImages = async (groupIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidFile = files.find((file) => !allowed.includes(file.type))
    if (invalidFile) {
      toast.error('Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF.')
      if (subInputsRef.current[groupIndex]) subInputsRef.current[groupIndex]!.value = ''
      return
    }

    try {
      setUploadingSubIndex(groupIndex)
      const uploaded = await Promise.all(files.map((file) => uploadService.uploadImage(file, 'projetos')))

      setGaleria((prev) => prev.map((group, i) => {
        if (i !== groupIndex) return group
        return {
          ...group,
          subImagens: [...group.subImagens, ...uploaded.map((item) => item.url)],
        }
      }))

      toast.success('Subimagens adicionadas com sucesso')
    } catch (error) {
      console.error('Erro ao enviar subimagens:', error)
      toast.error('Erro ao enviar subimagens')
    } finally {
      setUploadingSubIndex(null)
      if (subInputsRef.current[groupIndex]) subInputsRef.current[groupIndex]!.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragActive(false)
    }
  }

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const moveGalleryItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setGaleria((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDraggedImageIndex(null)
      return
    }

    moveGalleryItem(draggedImageIndex, targetIndex)

    setDraggedImageIndex(null)
  }

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null)
  }

  const moveSubImage = (groupIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setGaleria((prev) => prev.map((group, i) => {
      if (i !== groupIndex) return group

      const nextSubs = [...group.subImagens]
      const [moved] = nextSubs.splice(fromIndex, 1)
      nextSubs.splice(toIndex, 0, moved)

      return {
        ...group,
        subImagens: nextSubs,
      }
    }))
  }

  const handleSubImageDragStart = (groupIndex: number, subIndex: number) => {
    setDraggedSubImage({ groupIndex, subIndex })
  }

  const handleSubImageDrop = (e: React.DragEvent<HTMLDivElement>, groupIndex: number, targetSubIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedSubImage) return
    if (draggedSubImage.groupIndex !== groupIndex) {
      setDraggedSubImage(null)
      return
    }
    if (draggedSubImage.subIndex === targetSubIndex) {
      setDraggedSubImage(null)
      return
    }

    moveSubImage(groupIndex, draggedSubImage.subIndex, targetSubIndex)
    setDraggedSubImage({ groupIndex, subIndex: targetSubIndex })
  }

  const handleSubImageDragEnd = () => {
    setDraggedSubImage(null)
  }

  const handleSubImageTouchDragStart = (groupIndex: number, subIndex: number, e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDraggedSubImage({ groupIndex, subIndex })
  }

  const handleSubImageTouchDragMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!draggedSubImage) return
    const touch = e.touches[0]
    if (!touch) return
    const targetEl = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest('[data-sub-index]') as HTMLElement | null
    if (!targetEl) return
    const targetGroupIndex = Number(targetEl.dataset.groupIndex)
    const targetSubIndex = Number(targetEl.dataset.subIndex)
    if (Number.isNaN(targetSubIndex) || Number.isNaN(targetGroupIndex)) return
    if (targetGroupIndex !== draggedSubImage.groupIndex) return
    if (targetSubIndex === draggedSubImage.subIndex) return
    e.preventDefault()
    moveSubImage(draggedSubImage.groupIndex, draggedSubImage.subIndex, targetSubIndex)
    setDraggedSubImage({ groupIndex: draggedSubImage.groupIndex, subIndex: targetSubIndex })
  }

  const handleSubImageTouchDragEnd = () => {
    setDraggedSubImage(null)
  }

  const handleTouchDragStart = (index: number, e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDraggedImageIndex(index)
  }

  const handleTouchDragMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (draggedImageIndex === null) return

    const touch = e.touches[0]
    if (!touch) return

    const targetEl = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest('[data-gallery-index]') as HTMLElement | null

    if (!targetEl) return

    const targetIndex = Number(targetEl.dataset.galleryIndex)
    if (Number.isNaN(targetIndex) || targetIndex === draggedImageIndex) return

    e.preventDefault()
    moveGalleryItem(draggedImageIndex, targetIndex)
    setDraggedImageIndex(targetIndex)
  }

  const handleTouchDragEnd = () => {
    setDraggedImageIndex(null)
  }

  const handleRemoveImage = (index: number) => {
    setGaleria((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveSubImage = (groupIndex: number, subIndex: number) => {
    setGaleria((prev) => prev.map((group, i) => {
      if (i !== groupIndex) return group
      return {
        ...group,
        subImagens: group.subImagens.filter((_, j) => j !== subIndex),
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (galeria.length === 0) {
      toast.error('Adicione ao menos uma imagem na galeria')
      return
    }

    try {
      setSaving(true)
      await onSave({ subtitulo, titulo, texto, imagemCapa, galeria, publicado: true })
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-[#235937] focus:border-transparent resize-none'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          title="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Projeto' : 'Novo Projeto'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Atualize as informações do projeto' : 'Preencha as informações do novo projeto'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Subtítulo</label>
            <AutoResizeInput
              
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              required
              list="projetos-subtitulos"
              placeholder="Ex: Área Gourmet"
              className={inputCls}
            />
            <datalist id="projetos-subtitulos">
              {sugestoesSubtitulo.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelCls}>Título do projeto</label>
            <AutoResizeInput
              
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex: Cozinha planejada integrada"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Texto do projeto</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
              rows={8}
              placeholder="Descreva o projeto, materiais, diferenciais e benefícios..."
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Imagem de capa</label>
            <p className="text-xs text-gray-500 mb-2">
              Recomendado: 1080 x 1350 px (proporção 4:5), até 2 MB.
            </p>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddCover}
              className="hidden"
            />

            {imagemCapa ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 w-full max-w-xs aspect-[4/5]">
                <OptimizedImage src={resolveImageUrl(imagemCapa)} alt="Capa do projeto" sizes="(max-width: 768px) 100vw, 320px" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-2 py-1 rounded-md bg-black/60 text-white text-xs hover:bg-black/70 transition-colors cursor-pointer"
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() => setImagemCapa(null)}
                    className="p-1 rounded-full bg-black/60 hover:bg-black/70 text-white transition-colors cursor-pointer"
                    title="Remover capa"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full max-w-xs h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#235937] hover:bg-[#235937]/5 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={18} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  {uploadingCover ? 'Enviando capa...' : 'Adicionar imagem de capa'}
                </span>
              </button>
            )}
          </div>

          <div>
            <label className={labelCls}>Galeria de imagens</label>
            <p className="text-xs text-gray-500 mb-2">
              Recomendado: 1600 x 1200 px (proporção 4:3), até 2 MB por imagem.
            </p>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className="space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                aria-label="Adicionar imagens na galeria"
                className={`w-full h-28 rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group ${
                  isDragActive
                    ? 'border-[#235937] bg-[#235937]/10'
                    : 'border-gray-200 hover:border-[#235937] hover:bg-[#235937]/5'
                }`}
              >
                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-[#235937]/10 transition-colors">
                  <Upload size={18} className="text-gray-500 group-hover:text-[#235937] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-[#235937] transition-colors">
                    {uploadingImages ? 'Enviando imagens...' : isDragActive ? 'Solte as imagens aqui' : 'Adicionar imagens na galeria'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Arraste e solte aqui ou clique para selecionar (PNG, JPG, WEBP ou GIF)</p>
                </div>
              </div>

              {galeria.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
                  {galeria.map((group, index) => (
                    <div
                      key={`${group.url}-${index}`}
                      data-gallery-index={index}
                      draggable
                      onDragStart={() => handleImageDragStart(index)}
                      onDragEnd={handleImageDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => handleImageDrop(e, index)}
                      className={`relative rounded-xl border bg-gray-50 p-2.5 ${
                        draggedImageIndex === index ? 'border-[#235937] opacity-70' : 'border-gray-200'
                      }`}
                      title="Arraste para reordenar"
                    >
                      <div className="relative rounded-lg overflow-hidden w-full aspect-[3/2] cursor-move">
                        <OptimizedImage src={resolveImageUrl(group.url)} alt={`Imagem principal ${index + 1}`} sizes="(max-width: 1024px) 50vw, 320px" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white touch-none cursor-grab active:cursor-grabbing"
                          title="Arraste para reordenar"
                          aria-label="Arrastar para reordenar"
                          onTouchStart={(e) => handleTouchDragStart(index, e)}
                          onTouchMove={handleTouchDragMove}
                          onTouchEnd={handleTouchDragEnd}
                          onTouchCancel={handleTouchDragEnd}
                        >
                          <GripVertical size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                          title="Remover imagem principal"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          Imagem {index + 1} - {group.subImagens.length} SubImagem{group.subImagens.length === 1 ? '' : 'ns'}
                        </p>
                        <div>
                          <input
                            ref={(el) => { subInputsRef.current[index] = el }}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleAddSubImages(index, e)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => subInputsRef.current[index]?.click()}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer"
                          >
                            {uploadingSubIndex === index ? 'Enviando...' : 'SubImagens'}
                          </button>
                        </div>
                      </div>

                      {group.subImagens.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {group.subImagens.map((subUrl, subIndex) => (
                            <div
                              key={`${subUrl}-${subIndex}`}
                              data-group-index={index}
                              data-sub-index={subIndex}
                              draggable
                              onDragStart={() => handleSubImageDragStart(index, subIndex)}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onDrop={(e) => handleSubImageDrop(e, index, subIndex)}
                              onDragEnd={handleSubImageDragEnd}
                              className={`relative rounded-md overflow-hidden aspect-square border cursor-move ${
                                draggedSubImage?.groupIndex === index && draggedSubImage?.subIndex === subIndex
                                  ? 'border-[#235937] opacity-70'
                                  : 'border-gray-200'
                              }`}
                              title="Arraste para reordenar SubImagens"
                            >
                              <OptimizedImage src={resolveImageUrl(subUrl)} alt={`Subimagem ${subIndex + 1}`} sizes="120px" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                className="absolute top-1 left-1 p-1 rounded-full bg-black/55 text-white touch-none cursor-grab active:cursor-grabbing"
                                title="Arraste para reordenar SubImagens"
                                aria-label="Arrastar para reordenar SubImagem"
                                onTouchStart={(e) => handleSubImageTouchDragStart(index, subIndex, e)}
                                onTouchMove={handleSubImageTouchDragMove}
                                onTouchEnd={handleSubImageTouchDragEnd}
                                onTouchCancel={handleSubImageTouchDragEnd}
                              >
                                <GripVertical size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubImage(index, subIndex)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/55 hover:bg-black/70 text-white transition-colors cursor-pointer"
                                title="Remover SubImagem"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImages || uploadingCover || uploadingSubIndex !== null}
              className="px-6 py-2.5 rounded-xl bg-[#235937] hover:bg-[#1b462b] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Criar projeto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps {
  projetoTitle: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteModal({ projetoTitle, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-50">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Excluir projeto</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Tem certeza que deseja excluir <span className="font-medium text-gray-700">"{projetoTitle}"</span>? Essa ação não poderá ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-[#235937] hover:bg-[#1b462b] text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProjetoCardProps {
  projeto: Projeto
  index: number
  onEdit: () => void
  onDelete: () => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
  onTouchDragStart: (index: number) => void
  onTouchDrop: (targetIndex: number) => void
}

function ProjetoCard({ projeto, index, onEdit, onDelete, isDragging, onDragStart, onDragEnd, onDrop, onTouchDragStart, onTouchDrop }: ProjetoCardProps) {
  const gripRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const grip = gripRef.current
    if (!grip) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      onTouchDragStart(index)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const card = el?.closest('[data-card-index]') as HTMLElement | null
      if (card) {
        const targetIndex = parseInt(card.dataset.cardIndex ?? '-1', 10)
        if (targetIndex >= 0 && targetIndex !== index) {
          onTouchDrop(targetIndex)
        }
      }
      onDragEnd()
    }

    grip.addEventListener('touchstart', handleTouchStart, { passive: false })
    grip.addEventListener('touchmove', handleTouchMove, { passive: false })
    grip.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      grip.removeEventListener('touchstart', handleTouchStart)
      grip.removeEventListener('touchmove', handleTouchMove)
      grip.removeEventListener('touchend', handleTouchEnd)
    }
  }, [index, onTouchDragStart, onTouchDrop, onDragEnd])

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div
      data-card-index={index}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop()
      }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
        isDragging ? 'border-[#235937] opacity-70' : 'border-gray-200'
      }`}
    >
      <div className="h-44 bg-gray-100 flex items-center justify-center">
        {projeto.imagemCapa || projeto.galeria.length > 0 ? (
          <OptimizedImage src={resolveImageUrl(projeto.imagemCapa ?? projeto.galeria[0]?.url)} alt={projeto.titulo} sizes="(max-width: 1024px) 50vw, 360px" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Images size={36} />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <button
            ref={gripRef}
            type="button"
            className="text-xs text-gray-400 flex items-center gap-1 touch-none select-none cursor-grab active:cursor-grabbing"
            title="Arraste para reordenar"
          >
            <GripVertical size={12} />
            Arrastar
          </button>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(projeto.createdAt)}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">{projeto.titulo}</h3>

        <p className="text-sm text-gray-500 line-clamp-3">{projeto.texto}</p>
        <p className="text-xs text-gray-400">
          {projeto.galeria.length} {projeto.galeria.length === 1 ? 'galeria' : 'galerias'}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-auto">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#235937] hover:bg-[#235937]/10 transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#235937] hover:text-[#1b462b] hover:bg-[#f7f3ea] transition-colors cursor-pointer"
            title="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

type View = 'list' | 'form'

export default function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [view, setView] = useState<View>('list')
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [draggedProjetoIndex, setDraggedProjetoIndex] = useState<number | null>(null)

  const loadProjetos = async () => {
    try {
      setLoading(true)
      const data = await projetoService.getAll()
      const mapped: Projeto[] = (Array.isArray(data) ? data : []).map((p) => ({
        id: p.id,
        subtitulo: p.subtitulo ?? '',
        titulo: p.titulo,
        texto: p.descricao,
        imagemCapa: p.imagem_capa ?? null,
        galeria: normalizeProjetoImagens(p.imagens),
        publicado: p.publicado,
        ordem: p.ordem,
        createdAt: p.createdAt,
      }))
      setProjetos(mapped)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjetos()
  }, [])

  const goToNew = () => { setEditingProjeto(null); setView('form'); window.scrollTo(0, 0) }
  const goToEdit = (p: Projeto) => { setEditingProjeto(p); setView('form'); window.scrollTo(0, 0) }
  const goToList = () => { setEditingProjeto(null); setView('list') }

  const handleCardDrop = async (targetIndex: number) => {
    if (draggedProjetoIndex === null || draggedProjetoIndex === targetIndex) {
      setDraggedProjetoIndex(null)
      return
    }

    const next = [...projetos]
    const [moved] = next.splice(draggedProjetoIndex, 1)
    next.splice(targetIndex, 0, moved)

    setProjetos(next)
    setDraggedProjetoIndex(null)

    try {
      setSavingOrder(true)
      await Promise.all(next.map((projeto, index) => projetoService.update(projeto.id, { ordem: index })))
      setProjetos(next.map((projeto, index) => ({ ...projeto, ordem: index })))
      toast.success('Ordem dos projetos atualizada')
    } catch (error) {
      console.error('Erro ao reordenar projetos:', error)
      toast.error('Erro ao salvar nova ordem dos projetos')
      await loadProjetos()
    } finally {
      setSavingOrder(false)
    }
  }

  const handleSave = async (data: Omit<Projeto, 'id' | 'createdAt'>) => {
    try {
      const payload = {
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        descricao: data.texto,
        imagem_capa: data.imagemCapa,
        imagens: data.galeria,
        publicado: data.publicado,
      }
      if (editingProjeto) {
        await projetoService.update(editingProjeto.id, payload)
        toast.success('Projeto atualizado com sucesso!')
      } else {
        await projetoService.create(payload)
        toast.success('Projeto criado com sucesso!')
      }
      goToList()
      await loadProjetos()
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erro ao salvar projeto')
    }
  }

  const confirmDelete = async () => {
    if (deletingId === null) return
    try {
      await projetoService.delete(deletingId)
      setDeletingId(null)
      toast.success('Projeto excluído com sucesso!')
      await loadProjetos()
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erro ao excluir projeto')
    }
  }

  if (view === 'form') {
    return <ProjetoForm projeto={editingProjeto} onBack={goToList} onSave={handleSave} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projetos.length} {projetos.length === 1 ? 'projeto cadastrado' : 'projetos cadastrados'}
            {savingOrder ? ' • salvando ordem...' : ''}
          </p>
        </div>
        <button
          onClick={goToNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#235937] hover:bg-[#1b462b] text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">Carregando projetos...</div>
        </div>
      ) : projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ImageIcon size={48} className="mb-3 opacity-30" />
          <p className="text-base font-medium">Nenhum projeto cadastrado</p>
          <p className="text-sm mt-1">Clique em "Novo Projeto" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projetos.map((projeto, index) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              onEdit={() => goToEdit(projeto)}
              onDelete={() => setDeletingId(projeto.id)}
              index={index}
              isDragging={draggedProjetoIndex === index}
              onDragStart={() => setDraggedProjetoIndex(index)}
              onDragEnd={() => setDraggedProjetoIndex(null)}
              onDrop={() => handleCardDrop(index)}
              onTouchDragStart={setDraggedProjetoIndex}
              onTouchDrop={handleCardDrop}
            />
          ))}
        </div>
      )}

      {deletingId !== null && (
        <DeleteModal
          projetoTitle={projetos.find((item) => item.id === deletingId)?.titulo ?? ''}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
