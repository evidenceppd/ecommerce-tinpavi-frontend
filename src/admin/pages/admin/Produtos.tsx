import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Check,
  Eye,
  GripVertical,
  FileQuestion,
  ImagePlus,
  MapPinned,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { resolveImageUrl } from '../../services/api'
import { produtoService, type Produto } from '../../services/produto.service'
import { categoriaProdutoService, type CategoriaProduto } from '../../services/categoriaProduto.service'
import { uploadService } from '../../services/upload.service'

const inputClass = 'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20'
const textareaClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20'
const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5'

const usageAreaOptions = ['Rodovias', 'Obras', 'Condominios', 'Estacionamentos', 'Empresas', 'Eventos']

type BulletItem = {
  id: string
  name: string
  value: string
}

type FaqItem = {
  id: string
  question: string
  answer: string
}

type ProductFormState = {
  name: string
  slug: string
  badge: string
  description: string
  bullets: string
  technicalSpecs: string
  applications: string
  faq: string
  price: string
  compareAtPrice: string
  stock: string
  categoryIds: string[]
  usageAreas: string[]
  galleryImages: string[]
  seoTitle: string
  seoDescription: string
  isFeatured: boolean
  isActive: boolean
}

type VariantFormState = {
  stock: string
  priceAdjustment: string
  attributes: string
  imageFile: File | null
  imagePreview: string
}

type VariantItem = {
  id?: string
  stock: number
  priceAdjustment: number
  attributes: string
  imageUrl: string
  isActive?: boolean
  position?: number
}

function createEmptyFormState(): ProductFormState {
  return {
    name: '',
    slug: '',
    badge: '',
    description: '',
    bullets: '',
    technicalSpecs: '',
    applications: '',
    faq: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    categoryIds: [],
    usageAreas: [],
    galleryImages: [],
    seoTitle: '',
    seoDescription: '',
    isFeatured: false,
    isActive: true,
  }
}

function createEmptyVariantState(): VariantFormState {
  return {
    stock: '',
    priceAdjustment: '',
    attributes: '',
    imageFile: null,
    imagePreview: '',
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createLocalItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createBulletItem(name = '', value = ''): BulletItem {
  return {
    id: createLocalItemId(),
    name,
    value,
  }
}

function createFaqItem(question = '', answer = ''): FaqItem {
  return {
    id: createLocalItemId(),
    question,
    answer,
  }
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseKeyValueLines(value: string) {
  return parseLines(value)
    .map((line) => {
      const [label, ...rest] = line.split(':')
      return { label: label?.trim(), value: rest.join(':').trim() }
    })
    .filter((item) => item.label && item.value)
}

function parseFaq(value: string) {
  return parseLines(value)
    .map((line) => {
      const [question, ...rest] = line.split('|')
      return { question: question?.trim(), answer: rest.join('|').trim() }
    })
    .filter((item) => item.question && item.answer)
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseBulletItems(value: string): BulletItem[] {
  return parseLines(value)
    .map((line) => {
      const [name, ...rest] = line.split(':')
      return createBulletItem(name?.trim() ?? '', rest.join(':').trim())
    })
    .filter((item) => item.name || item.value)
}

function formatBulletItem(item: BulletItem) {
  const name = item.name.trim()
  const value = item.value.trim().replace(/^:\s*/, '')

  if (!name && !value) return ''
  if (!value) return name
  return `${name}: ${value}`
}

function parseFaqItems(value: string): FaqItem[] {
  return parseLines(value)
    .map((line) => {
      const [question, ...rest] = line.split('|')
      return createFaqItem(question?.trim() ?? '', rest.join('|').trim())
    })
    .filter((item) => item.question || item.answer)
}

function formatFaqItem(item: FaqItem) {
  const question = item.question.trim()
  const answer = item.answer.trim().replace(/^\|\s*/, '')

  if (!question && !answer) return ''
  if (!answer) return question
  return `${question} | ${answer}`
}

export default function Produtos() {
  const [items, setItems] = useState<Produto[]>([])
  const [categories, setCategories] = useState<CategoriaProduto[]>([])
  const [selected, setSelected] = useState<Produto | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [view, setView] = useState<'home' | 'create'>('home')
  const [productSearch, setProductSearch] = useState('')
  const [selectedUsageAreas, setSelectedUsageAreas] = useState<string[]>([])
  const [form, setForm] = useState<ProductFormState>(createEmptyFormState)
  const [variant, setVariant] = useState<VariantFormState>(createEmptyVariantState)
  const [variantItems, setVariantItems] = useState<VariantItem[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [uploadingVariantImage, setUploadingVariantImage] = useState(false)
  const [isVariantImageDragActive, setIsVariantImageDragActive] = useState(false)
  const [bulletItems, setBulletItems] = useState<BulletItem[]>([])
  const [technicalSpecItems, setTechnicalSpecItems] = useState<BulletItem[]>([])
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [isGalleryDragActive, setIsGalleryDragActive] = useState(false)
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const specPreview = parseKeyValueLines(form.technicalSpecs)
  const faqPreview = parseFaq(form.faq)
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      const searchable = [
        item.name,
        item.slug,
        item.sku,
        item.badge,
        item.brand,
        item.description,
      ].filter(Boolean).join(' ').toLowerCase()

      return searchable.includes(query)
    })
  }, [items, productSearch])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      bullets: bulletItems.map(formatBulletItem).filter(Boolean).join('\n'),
    }))
  }, [bulletItems])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      technicalSpecs: technicalSpecItems.map(formatBulletItem).filter(Boolean).join('\n'),
    }))
  }, [technicalSpecItems])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      faq: faqItems.map(formatFaqItem).filter(Boolean).join('\n'),
    }))
  }, [faqItems])

  const load = async () => {
    const [adminProductsResult, categoriesResult] = await Promise.allSettled([
      produtoService.list({ page: 1, limit: 100 }),
      categoriaProdutoService.list({ page: 1, limit: 100 }),
    ])

    const adminProducts = adminProductsResult.status === 'fulfilled' ? adminProductsResult.value.items : []
    if (adminProductsResult.status === 'rejected') {
      console.error('Falha ao carregar produtos administrativos.', adminProductsResult.reason)
      toast.error('Falha ao carregar produtos')
    }

    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.items : []
    if (categoriesResult.status === 'rejected') {
      console.error('Falha ao carregar categorias.', categoriesResult.reason)
      toast.error('Falha ao carregar categorias')
    }

    setItems(adminProducts)
    setCategories(categories)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleAddBullet = () => {
    setBulletItems((prev) => [...prev, createBulletItem()])
  }

  const handleRemoveBullet = (id: string) => {
    setBulletItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateBullet = (id: string, key: 'name' | 'value', value: string) => {
    setBulletItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  const handleAddTechnicalSpec = () => {
    setTechnicalSpecItems((prev) => [...prev, createBulletItem()])
  }

  const handleRemoveTechnicalSpec = (id: string) => {
    setTechnicalSpecItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateTechnicalSpec = (id: string, key: 'name' | 'value', value: string) => {
    setTechnicalSpecItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  const handleAddFaq = () => {
    setFaqItems((prev) => [...prev, createFaqItem()])
  }

  const handleRemoveFaq = (id: string) => {
    setFaqItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateFaq = (id: string, key: 'question' | 'answer', value: string) => {
    setFaqItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  const resetForm = () => {
    setEditingProductId(null)
    setForm(createEmptyFormState())
    setBulletItems([])
    setTechnicalSpecItems([])
    setFaqItems([])
    setVariantItems([])
    setVariant(createEmptyVariantState())
    setEditingVariantIndex(null)
    setSelectedUsageAreas([])
  }

  const readUsageAreasFromForm = (event?: React.FormEvent) => {
    const formElement = event?.currentTarget instanceof HTMLFormElement ? event.currentTarget : null
    if (!formElement) return selectedUsageAreas

    return Array.from(formElement.querySelectorAll<HTMLInputElement>('input[name="usageAreas"]:checked'))
      .map((input) => input.value)
  }

  const buildProductPayload = (event?: React.FormEvent) => {
    const usageAreas = readUsageAreasFromForm(event)
    const normalizedBullets = bulletItems.map(formatBulletItem).filter(Boolean)
    const normalizedTechnicalSpecs = form.technicalSpecs.trim()
    const normalizedApplications = form.applications.trim()
    const normalizedSlug = form.slug.trim()
    const primaryCategoryId = form.categoryIds.find((item) => item.trim())?.trim()
    const categoryIds = primaryCategoryId ? [primaryCategoryId] : []
    const normalizedPrice = Number(form.price || 0)
    const normalizedCompareAtPrice = Number(form.compareAtPrice || 0)
    const normalizedStock = Number(form.stock || 0)

    return {
      name: form.name,
      slug: normalizedSlug || slugify(form.name),
      badge: form.badge ? form.badge.toUpperCase() : undefined,
      description: form.description || undefined,
      highlights: normalizedBullets,
      bullets: normalizedBullets,
      technicalSpecs: normalizedTechnicalSpecs || undefined,
      specsTable: specPreview,
      applications: normalizedApplications || undefined,
      faqs: faqPreview,
      usageAreas,
      galleryImages: form.galleryImages,
      price: normalizedPrice,
      compareAtPrice: normalizedCompareAtPrice === 0 ? undefined : normalizedCompareAtPrice,
      stock: normalizedStock,
      categoryIds,
      variants: variantItems.length > 0 ? variantItems.map((v) => ({
        id: v.id,
        stock: Number(v.stock),
        priceAdjustment: v.priceAdjustment ? Number(v.priceAdjustment) : undefined,
        attributes: v.attributes
          ? Object.fromEntries(
              v.attributes.split(',').map((item) => item.trim().split(':').map((part) => part.trim())).filter(([key, val]) => key && val),
            )
          : undefined,
        imageUrl: v.imageUrl || undefined,
        isActive: v.isActive,
        position: v.position,
      })) : undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    }
  }

  const openEditor = async (product: Produto) => {
    const galleryImages = product.galleryImages?.length
      ? product.galleryImages
      : product.images?.map((image) => image.url) ?? []
    const nextBullets = product.bullets?.length
      ? parseBulletItems(product.bullets.join('\n'))
      : []
    const nextSpecs = product.specsTable?.length
      ? product.specsTable.map((item) => createBulletItem(item.label, item.value))
      : parseBulletItems(product.technicalSpecs || '')
    const nextFaqs = product.faqs?.length
      ? product.faqs.map((item) => createFaqItem(item.question, item.answer))
      : []

    setEditingProductId(product.id)
    setSelected(null)
    setBulletItems(nextBullets)
    setTechnicalSpecItems(nextSpecs)
    setFaqItems(nextFaqs)
    try {
      const variantResponse = await produtoService.listVariants(product.id)
      const sourceVariants = variantResponse.length > 0 ? variantResponse : (product.variants || [])
      setVariantItems(sourceVariants.map((item, index) => ({
        id: item.id,
        stock: Number(item.stock || 0),
        priceAdjustment: Number(item.priceAdjustment || 0),
        attributes: item.attributes ? Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') : '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive,
        position: item.position ?? index + 1,
      })))
    } catch {
      setVariantItems((product.variants || []).map((item, index) => ({
        id: item.id,
        stock: Number(item.stock || 0),
        priceAdjustment: Number(item.priceAdjustment || 0),
        attributes: item.attributes ? Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') : '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive,
        position: item.position ?? index + 1,
      })))
    }
    setVariant(createEmptyVariantState())
    setEditingVariantIndex(null)
    const productUsageAreas = product.usageAreas || []
    const primaryCategoryId = product.categoryId || product.categoryIds?.[0]

    setSelectedUsageAreas(productUsageAreas)
    setForm({
      name: product.name || '',
      slug: product.customSlug || '',
      badge: product.badge || '',
      description: product.description || '',
      bullets: nextBullets.map(formatBulletItem).filter(Boolean).join('\n'),
      technicalSpecs: nextSpecs.map(formatBulletItem).filter(Boolean).join('\n'),
      applications: product.applications || '',
      faq: nextFaqs.map(formatFaqItem).filter(Boolean).join('\n'),
      price: String(Number(product.price || 0)),
      compareAtPrice: product.compareAtPrice ? String(Number(product.compareAtPrice)) : '',
      stock: String(Number(product.stock || 0)),
      categoryIds: primaryCategoryId ? [primaryCategoryId] : [],
      usageAreas: productUsageAreas,
      galleryImages,
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive ?? true,
    })
    setView('create')
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    const hasTechnicalContent = bulletItems.some((item) => Boolean(formatBulletItem(item))) || technicalSpecItems.some((item) => Boolean(formatBulletItem(item)))

    if (form.categoryIds.length < 1) {
      toast.error('Selecione pelo menos uma categoria para o produto.')
      return
    }

    if (!hasTechnicalContent) {
      toast.error('Preencha ao menos um destaque ou uma especificacao tecnica.')
      return
    }

    if (!form.applications.trim()) {
      toast.error('Preencha o campo Aplicacoes.')
      return
    }

    try {
      const payload = buildProductPayload(event)
      if (import.meta.env.DEV) {
        console.info('[Produtos] payload enviado', {
          id: editingProductId,
          usageAreas: payload.usageAreas,
          payload,
        })
      }
      let savedProduct: Produto
      if (editingProductId) {
        savedProduct = await produtoService.update(editingProductId, payload)
      } else {
        savedProduct = await produtoService.create(payload)
      }
      toast.success(editingProductId ? 'Produto atualizado' : 'Produto criado')
      resetForm()
      await load()
      setItems((prev) => {
        const next = new Map(prev.map((item) => [item.id, item]))
        next.set(savedProduct.id, savedProduct)
        return Array.from(next.values())
      })
      setView('home')
    } catch (err) {
      const apiMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(apiMsg ?? (editingProductId ? 'Erro ao atualizar produto' : 'Erro ao criar produto'))
    }
  }

  const handleOpen = async (id: string, fallbackProduct?: Produto) => {
    try {
      const response = await produtoService.getById(id)
      setSelected(response)
      setVariant(createEmptyVariantState())
    } catch {
      if (fallbackProduct) {
        setSelected(fallbackProduct)
        setVariant(createEmptyVariantState())
        toast.warning('Produto carregado pela rota publica. Faça login novamente para editar dados administrativos.')
        return
      }
      toast.error('Falha ao carregar produto')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await produtoService.remove(id)
      toast.success('Produto desativado')
      if (selected?.id === id) setSelected(null)
      await load()
    } catch {
      toast.error('Erro ao desativar produto')
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: [categoryId],
    }))
  }

  const handleUsageToggle = (area: string) => {
    setSelectedUsageAreas((prev) => {
      const next = prev.includes(area)
        ? prev.filter((item) => item !== area)
        : [...prev, area]

      setForm((current) => ({ ...current, usageAreas: next }))
      return next
    })
  }

  const handleUploadGalleryFiles = async (files: File[]) => {
    if (files.length === 0) return

    try {
      setUploadingGallery(true)
      const uploaded = await Promise.all(files.map((file) => uploadService.uploadImage(file, 'produtos')))
      setForm((prev) => ({ ...prev, galleryImages: [...prev.galleryImages, ...uploaded.map((item) => item.url)] }))
      toast.success('Imagens adicionadas à galeria')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar imagens'
      toast.error(message)
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const handleGalleryInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleUploadGalleryFiles(Array.from(e.target.files ?? []))
  }

  const uploadVariantImageFile = async (file: File) => {
    const preview = URL.createObjectURL(file)
    setVariant((prev) => ({ ...prev, imageFile: file, imagePreview: preview }))
    try {
      setUploadingVariantImage(true)
      const result = await uploadService.uploadImage(file, 'produtos')
      setVariant((prev) => ({ ...prev, imagePreview: resolveImageUrl(result.url) }))
    } catch {
      toast.error('Erro ao enviar imagem da variante')
      setVariant((prev) => ({ ...prev, imageFile: null, imagePreview: '' }))
    } finally {
      setUploadingVariantImage(false)
    }
  }

  const handleVariantImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsVariantImageDragActive(true)
  }

  const handleVariantImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsVariantImageDragActive(false)
    }
  }

  const handleVariantImageDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsVariantImageDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadVariantImageFile(file)
  }

  const handleGalleryDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGalleryDragActive(true)
  }

  const handleGalleryDropZoneDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGalleryDragActive(true)
  }

  const handleGalleryDropZoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsGalleryDragActive(false)
    }
  }

  const handleGalleryDropZoneDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGalleryDragActive(false)

    if (draggedGalleryIndex !== null) return

    await handleUploadGalleryFiles(Array.from(e.dataTransfer.files ?? []))
  }

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setForm((prev) => {
      const next = [...prev.galleryImages]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, galleryImages: next }
    })
  }

  const handleGalleryDragStart = (index: number) => {
    setDraggedGalleryIndex(index)
  }

  const handleGalleryDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleGalleryDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedGalleryIndex === null || draggedGalleryIndex === targetIndex) {
      setDraggedGalleryIndex(null)
      return
    }

    moveGalleryImage(draggedGalleryIndex, targetIndex)
    setDraggedGalleryIndex(targetIndex)
  }

  const handleGalleryDragEnd = () => {
    setDraggedGalleryIndex(null)
  }

  const getProductImage = (item: Produto) => {
    return item.galleryImages?.[0] || item.images?.[0]?.url || '/placeholder.svg'
  }

  const getProductCategoriesLabel = (item: Produto) => {
    return item.categoryName || 'Sem categoria'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#f5c518]">Catalogo Tinpavi</p>
          <h2 className="text-2xl font-bold text-slate-950">Produtos</h2>
          <p className="text-sm text-slate-500">
            {view === 'home'
              ? 'Consulte e gerencie os produtos cadastrados.'
              : 'Cadastre conteudo comercial, galeria, especificacoes, aplicacoes e FAQ.'}
          </p>
        </div>
        {view === 'home' ? (
          <button
            type="button"
            onClick={() => {
              resetForm()
              setView('create')
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-4 text-sm font-bold text-slate-950 hover:bg-[#e0b614] cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar produto
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setView('home')
              resetForm()
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-[#f5c518] cursor-pointer"
          >
            Voltar para produtos
          </button>
        )}
      </div>

      {view === 'home' ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome, SKU, slug ou descrição"
                  className={`${inputClass} w-full pl-9`}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-2 font-bold text-slate-700">{filteredProducts.length}</span>
                produtos encontrados
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative flex h-48 items-center justify-center bg-slate-50">
                  {item.badge ? (
                    <span className="absolute left-3 top-3 rounded bg-[#f5c518] px-2 py-1 text-[10px] font-black text-slate-950">
                      {item.badge}
                    </span>
                  ) : null}
                  <img src={getProductImage(item)} alt={item.name} className="h-full w-full object-contain p-5" />
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{item.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.sku || item.slug}</p>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-950">{currency(item.price)}</p>
                      {item.compareAtPrice ? <p className="text-xs text-slate-400 line-through">{currency(item.compareAtPrice)}</p> : null}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Estoque</p>
                      <p className="font-bold text-slate-800">{item.stock} un.</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Categoria</p>
                      <p className="truncate font-bold text-slate-800">{getProductCategoriesLabel(item)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleOpen(item.id, item)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f5c518]/15 text-sm font-bold text-[#8a6a00] hover:bg-[#f5c518]/25 cursor-pointer"
                    >
                      <Eye size={15} />
                      Gerenciar
                    </button>
                    <button
                      type="button"
                      onClick={() => void openEditor(item)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-600 hover:border-[#f5c518] hover:text-slate-950 cursor-pointer"
                      aria-label="Editar produto"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-red-100 px-3 text-red-600 hover:bg-red-50 cursor-pointer"
                      aria-label="Excluir produto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <PackagePlus className="mx-auto text-slate-300" size={36} />
              <h3 className="mt-3 text-base font-bold text-slate-950">Nenhum produto encontrado</h3>
              <p className="mt-1 text-sm text-slate-500">Ajuste a busca ou cadastre um novo produto.</p>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setView('create')
                }}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#f5c518] px-4 text-sm font-bold text-slate-950 cursor-pointer"
              >
                Cadastrar produto
              </button>
            </div>
          ) : null}

          {selected ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelected(null)
              }}
            >
              <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-black uppercase text-[#c99b00]">Gerenciar produto</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{selected.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{selected.sku || selected.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-950 cursor-pointer"
                    aria-label="Fechar gerenciamento"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid max-h-[76vh] gap-5 overflow-y-auto p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-64 items-center justify-center rounded-lg bg-white">
                      <img src={getProductImage(selected)} alt={selected.name} className="h-full w-full object-contain p-5" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">Preco</p>
                        <p className="font-black text-slate-950">{currency(selected.price)}</p>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">Estoque</p>
                        <p className="font-black text-slate-950">{selected.stock} un.</p>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">Categoria</p>
                        <p className="truncate font-black text-slate-950">{getProductCategoriesLabel(selected)}</p>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">Status</p>
                        <p className={selected.isActive ? 'font-black text-emerald-700' : 'font-black text-slate-500'}>
                          {selected.isActive ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <section className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-black text-slate-950">Descricao</h4>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {selected.description || 'Sem descricao cadastrada.'}
                      </p>
                    </section>

                    <section className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-black text-slate-950">Destaques</h4>
                      {selected.bullets?.length ? (
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {selected.bullets.map((bullet, index) => (
                            <li key={`${bullet}-${index}`} className="flex gap-2">
                              <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">Sem destaques cadastrados.</p>
                      )}
                    </section>

                    <section className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-black text-slate-950">Galeria</h4>
                      {getProductImage(selected) ? (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {(selected.galleryImages?.length ? selected.galleryImages : selected.images?.map((image) => image.url) || [getProductImage(selected)]).map((url, index) => (
                            <img key={`${url}-${index}`} src={url} alt={`${selected.name} ${index + 1}`} className="aspect-square rounded-lg border border-slate-200 object-contain p-2" />
                          ))}
                        </div>
                      ) : null}
                    </section>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
                  <a
                    href={`/produto/${selected.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-[#f5c518] cursor-pointer"
                  >
                    Ver no site
                  </a>
                  <button
                    type="button"
                    onClick={() => void openEditor(selected)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-4 text-sm font-black text-slate-950 hover:bg-[#e0b614] cursor-pointer"
                  >
                    <Pencil size={16} />
                    Editar produto
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5c518]/15 text-[#c99b00]">
            <PackagePlus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">{editingProductId ? 'Editar produto' : 'Cadastrar produto'}</h3>
            <p className="text-sm text-slate-500">Campos usados na pagina de produto e nos cards da loja.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 p-4">
              <h4 className="mb-4 text-sm font-black text-slate-950">Dados comerciais</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <label className="md:col-span-2">
                  <span className={labelClass}>Nome do produto <span className="text-red-500">*</span></span>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const nextName = e.target.value
                      setForm((prev) => {
                        const previousAutoSlug = slugify(prev.name)
                        const shouldAutoUpdateSlug = !prev.slug.trim() || prev.slug === previousAutoSlug

                        return {
                          ...prev,
                          name: nextName,
                          slug: shouldAutoUpdateSlug ? slugify(nextName) : prev.slug,
                        }
                      })
                    }}
                    required
                    placeholder="Ex.: Cone rodoviario flexivel 75 cm"
                    className={`${inputClass} w-full`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Slug</span>
                  <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="cone-75cm" className={`${inputClass} w-full`} />
                </label>
                <label>
                  <span className={labelClass}>Preco <span className="text-red-500">*</span></span>
                  <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} className={`${inputClass} w-full`} />
                </label>
                {/* <label>
                  <span className={labelClass}>Preco promocional/de</span>
                  <input type="number" min={0} step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))} className={`${inputClass} w-full`} />
                </label> */}
                <label>
                  <span className={labelClass}>Estoque</span>
                  <input type="number" min={0} value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} className={`${inputClass} w-full`} />
                </label>
                <label>
                  <span className={labelClass}>Selo do card</span>
                  <input value={form.badge} onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value.toUpperCase() }))} placeholder="MAIS VENDIDO" className={`${inputClass} w-full uppercase`} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus size={17} className="text-[#c99b00]" />
                <h4 className="text-sm font-black text-slate-950">Galeria do produto</h4>
              </div>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryInputChange} className="hidden" />
              <div
                role="button"
                tabIndex={0}
                onClick={() => galleryInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    galleryInputRef.current?.click()
                  }
                }}
                onDragOver={handleGalleryDropZoneDragOver}
                onDragEnter={handleGalleryDropZoneDragEnter}
                onDragLeave={handleGalleryDropZoneDragLeave}
                onDrop={handleGalleryDropZoneDrop}
                aria-label="Adicionar imagens na galeria"
                className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer ${
                  isGalleryDragActive
                    ? 'border-[#f5c518] bg-[#f5c518]/10'
                    : 'border-slate-200 bg-slate-50 hover:border-[#f5c518] hover:bg-[#f5c518]/5'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#c99b00] shadow-sm">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {uploadingGallery ? 'Enviando imagens...' : isGalleryDragActive ? 'Solte as imagens aqui' : 'Arraste e solte imagens ou clique para enviar'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Recomendado 1200 x 1200 px (1:1). JPG, PNG ou WEBP, ate 5 MB. Depois, arraste os cards para reorganizar.</p>
                </div>
              </div>
              {form.galleryImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {form.galleryImages.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      draggable
                      onDragStart={() => handleGalleryDragStart(index)}
                      onDragOver={handleGalleryDragOver}
                      onDrop={(e) => handleGalleryDrop(e, index)}
                      onDragEnd={handleGalleryDragEnd}
                      className={`relative overflow-hidden rounded-lg border bg-slate-50 ${draggedGalleryIndex === index ? 'border-[#f5c518] opacity-75' : 'border-slate-200'}`}
                      title="Arraste para reordenar"
                    >
                      <div className="relative aspect-square">
                        <img src={resolveImageUrl(url)} alt={`Imagem da galeria ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== index) }))}
                          className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-red-600 shadow-sm cursor-pointer"
                          title="Remover imagem"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="absolute left-2 top-2 rounded-md bg-white/90 p-1.5 text-slate-700 shadow-sm cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <label className="flex h-80 min-h-0 flex-col">
                <span className={labelClass}>Descricao do produto</span>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Texto da aba Descricao..." className={`${textareaClass} min-h-0 flex-1 w-full resize-none`} />
              </label>
              <div className="flex h-80 flex-col">
                <span className={labelClass}>Pontos de destaque <span className="text-red-500">*</span></span>
                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className={`min-h-0 flex-1 space-y-3 ${bulletItems.length > 2 ? 'overflow-y-auto pr-1' : ''}`}>
                    {bulletItems.length === 0 ? (
                      <p className="text-sm text-slate-500">Clique em Criar para adicionar um ponto de destaque.</p>
                    ) : (
                      bulletItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] sm:items-center">
                            <input
                              value={item.name}
                              onChange={(e) => handleUpdateBullet(item.id, 'name', e.target.value)}
                              placeholder="Nome"
                              className={inputClass}
                            />
                            <div className="flex items-center gap-2">
                              <span className="hidden text-sm font-bold text-slate-400 sm:block">:</span>
                              <input
                                value={item.value}
                                onChange={(e) => handleUpdateBullet(item.id, 'value', e.target.value.replace(/^:\s*/, ''))}
                                placeholder="Valor"
                                className={`${inputClass} w-full`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveBullet(item.id)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Remover destaque"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Prévia: {formatBulletItem(item) || 'nome: valor'}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#f5c518] bg-white px-3 text-sm font-bold text-slate-950 cursor-pointer"
                  >
                    <Plus size={15} />
                    Criar
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-80 min-h-0 flex-col">
                <span className={labelClass}>Especificacoes tecnicas <span className="text-red-500">*</span></span>
                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className={`min-h-0 flex-1 space-y-3 ${technicalSpecItems.length > 2 ? 'overflow-y-auto pr-1' : ''}`}>
                    {technicalSpecItems.length === 0 ? (
                      <p className="text-sm text-slate-500">Clique em Criar para adicionar uma especificação técnica.</p>
                    ) : (
                      technicalSpecItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] sm:items-center">
                            <input
                              value={item.name}
                              onChange={(e) => handleUpdateTechnicalSpec(item.id, 'name', e.target.value)}
                              placeholder="Nome"
                              className={inputClass}
                            />
                            <div className="flex items-center gap-2">
                              <span className="hidden text-sm font-bold text-slate-400 sm:block">:</span>
                              <input
                                value={item.value}
                                onChange={(e) => handleUpdateTechnicalSpec(item.id, 'value', e.target.value.replace(/^:\s*/, ''))}
                                placeholder="Valor"
                                className={`${inputClass} w-full`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTechnicalSpec(item.id)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Remover especificação"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Prévia: {formatBulletItem(item) || 'nome: valor'}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTechnicalSpec}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#f5c518] bg-white px-3 text-sm font-bold text-slate-950 cursor-pointer"
                  >
                    <Plus size={15} />
                    Criar
                  </button>
                </div>
              </div>
              <label className="flex h-80 min-h-0 flex-col">
                <span className={labelClass}>Aplicacoes <span className="text-red-500">*</span></span>
                <textarea value={form.applications} onChange={(e) => setForm((prev) => ({ ...prev, applications: e.target.value }))} placeholder="Indicado para rodovias, estacionamentos..." className={`${textareaClass} min-h-0 flex-1 w-full resize-none`} />
              </label>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-80 min-h-0 flex-col">
                <span className={labelClass}>Perguntas frequentes</span>
                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className={`min-h-0 flex-1 space-y-3 ${faqItems.length > 2 ? 'overflow-y-auto pr-1' : ''}`}>
                    {faqItems.length === 0 ? (
                      <p className="text-sm text-slate-500">Clique em Criar para adicionar uma pergunta frequente.</p>
                    ) : (
                      faqItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] sm:items-center">
                            <input
                              value={item.question}
                              onChange={(e) => handleUpdateFaq(item.id, 'question', e.target.value)}
                              placeholder="Pergunta"
                              className={inputClass}
                            />
                            <div className="flex items-center gap-2">
                              <span className="hidden text-sm font-bold text-slate-400 sm:block">|</span>
                              <input
                                value={item.answer}
                                onChange={(e) => handleUpdateFaq(item.id, 'answer', e.target.value.replace(/^\|\s*/, ''))}
                                placeholder="Resposta"
                                className={`${inputClass} w-full`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(item.id)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Remover pergunta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Prévia: {formatFaqItem(item) || 'pergunta | resposta'}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#f5c518] bg-white px-3 text-sm font-bold text-slate-950 cursor-pointer"
                  >
                    <Plus size={15} />
                    Criar
                  </button>
                </div>
              </div>
              <div className="h-80 rounded-xl border border-slate-200 p-4 overflow-y-auto">
                <div className="mb-3 flex items-center gap-2">
                  <MapPinned size={17} className="text-[#c99b00]" />
                  <h4 className="text-sm font-black text-slate-950">Onde utilizar</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {usageAreaOptions.map((area) => (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={selectedUsageAreas.includes(area)}
                      onClick={() => handleUsageToggle(area)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm cursor-pointer ${
                        selectedUsageAreas.includes(area)
                          ? 'border-[#f5c518] bg-[#f5c518]/10 font-bold text-slate-950'
                          : 'border-slate-200 text-slate-600 hover:border-[#f5c518]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="usageAreas"
                        value={area}
                        checked={selectedUsageAreas.includes(area)}
                        readOnly
                        tabIndex={-1}
                        className="accent-[#f5c518]"
                      />
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Tags size={17} className="text-[#c99b00]" />
                  <h4 className="text-sm font-black text-slate-950">Categorias <span className="text-red-500">*</span></h4>
                </div>
                <p className="mb-3 text-xs text-slate-500">Selecione apenas uma categoria para o produto.</p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Cadastre categorias antes de vincular produtos.</p>
                  ) : categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="categoryId" checked={form.categoryIds[0] === category.id} onChange={() => handleCategoryToggle(category.id)} className="accent-[#f5c518]" />
                      {category.name}
                    </label>
                  ))}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                      className="accent-[#f5c518] h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-slate-700">Destaque</span>
                    <span className="text-xs text-slate-400">— exibe este produto na seção "Destaques por categoria"</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

          <section className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={17} className="text-[#c99b00]" />
              <h4 className="text-sm font-black text-slate-950">Variantes</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <label>
                <span className={labelClass}>Estoque</span>
                <input type="number" min={0} value={variant.stock} onChange={(e) => setVariant((prev) => ({ ...prev, stock: e.target.value }))} className={`${inputClass} w-full`} />
              </label>
              <label>
                <span className={labelClass}>Ajuste de preco</span>
                <input type="number" step="0.01" value={variant.priceAdjustment} onChange={(e) => setVariant((prev) => ({ ...prev, priceAdjustment: e.target.value }))} placeholder="0.00" className={`${inputClass} w-full`} />
              </label>
              <label>
                <span className={labelClass}>Atributos</span>
                <input value={variant.attributes} onChange={(e) => setVariant((prev) => ({ ...prev, attributes: e.target.value }))} placeholder="cor: amarelo, tamanho: G" className={`${inputClass} w-full`} />
              </label>
            </div>
            <div className="mt-3">
              <span className={labelClass}>Imagem da variante</span>
              {variant.imagePreview ? (
                <div className="relative mt-1 inline-block">
                  <img src={variant.imagePreview} alt="preview" className="h-24 w-24 rounded-xl object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setVariant((prev) => ({ ...prev, imageFile: null, imagePreview: '' }))}
                    className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow cursor-pointer hover:text-red-700"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => { const el = document.getElementById('variantImageInput') as HTMLInputElement | null; el?.click() }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (document.getElementById('variantImageInput') as HTMLInputElement | null)?.click() } }}
                  onDragOver={handleVariantImageDragOver}
                  onDragEnter={handleVariantImageDragOver}
                  onDragLeave={handleVariantImageDragLeave}
                  onDrop={handleVariantImageDrop}
                  className={`mt-1 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                    isVariantImageDragActive ? 'border-[#f5c518] bg-[#f5c518]/10' : uploadingVariantImage ? 'border-[#f5c518] bg-[#f5c518]/10' : 'border-slate-200 bg-slate-50 hover:border-[#f5c518] hover:bg-[#f5c518]/5'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#c99b00] shadow-sm">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {uploadingVariantImage ? 'Enviando imagem...' : isVariantImageDragActive ? 'Solte a imagem aqui' : 'Arraste e solte ou clique para enviar'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP ou GIF.</p>
                  </div>
                  <input
                    id="variantImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingVariantImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) await uploadVariantImageFile(file)
                    }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVariant: VariantItem = {
                  id: editingVariantIndex !== null ? variantItems[editingVariantIndex]?.id : undefined,
                  stock: Number(variant.stock || 0),
                  priceAdjustment: Number(variant.priceAdjustment || 0),
                  attributes: variant.attributes,
                  imageUrl: variant.imagePreview,
                  isActive: true,
                  position: editingVariantIndex !== null ? variantItems[editingVariantIndex]?.position : variantItems.length + 1,
                }

                setVariantItems((prev) => {
                  if (editingVariantIndex === null) {
                    return [...prev, nextVariant]
                  }

                  return prev.map((item, index) => (index === editingVariantIndex ? { ...item, ...nextVariant } : item))
                })
                setVariant(createEmptyVariantState())
                setEditingVariantIndex(null)
              }}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 cursor-pointer hover:border-[#f5c518] hover:text-[#8a6a00]"
            >
              <Plus size={14} /> {editingVariantIndex === null ? 'Adicionar variante' : 'Salvar variante'}
            </button>
            {editingVariantIndex !== null ? (
              <button
                type="button"
                onClick={() => {
                  setVariant(createEmptyVariantState())
                  setEditingVariantIndex(null)
                }}
                className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 cursor-pointer hover:border-slate-300"
              >
                Cancelar edicao
              </button>
            ) : null}
            {variantItems.length > 0 && (
              <ul className="mt-3 space-y-2">
                {variantItems.map((v, index) => (
                  <li key={index} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt="variante" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                        <Upload size={14} className="text-slate-400" />
                      </div>
                    )}
                    <span className="flex-1 text-slate-700">
                      Estoque: {v.stock}
                      {v.priceAdjustment !== 0 && ` | Ajuste: R$ ${v.priceAdjustment}`}
                      {v.attributes && ` | ${v.attributes}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVariant({
                          stock: String(v.stock),
                          priceAdjustment: String(v.priceAdjustment || ''),
                          attributes: v.attributes,
                          imageFile: null,
                          imagePreview: v.imageUrl,
                        })
                        setEditingVariantIndex(index)
                      }}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                      aria-label="Editar variante"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVariantItems((prev) => prev.filter((_, i) => i !== index))
                        if (editingVariantIndex === index) {
                          setEditingVariantIndex(null)
                          setVariant(createEmptyVariantState())
                        }
                      }}
                      className="text-red-400 hover:text-red-600 cursor-pointer shrink-0"
                      aria-label="Excluir variante"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 cursor-pointer">Limpar</button>
          <button type="submit" className="rounded-lg bg-[#f5c518] px-5 py-2 text-sm font-bold text-slate-950 cursor-pointer">
            {editingProductId ? 'Salvar alteracoes' : 'Criar produto'}
          </button>
        </div>
      </form>
      )}


    </div>
  )
}
