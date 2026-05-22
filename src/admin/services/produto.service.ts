import { api, resolveImageUrl } from './api'

export interface ProdutoVariant {
  id: string
  sku?: string
  stock: number
  priceAdjustment?: number | null
  attributes?: Record<string, string>
  imageUrl?: string | null
  isActive?: boolean
  position?: number
}

export interface ProdutoImage {
  id: string
  url: string
  altText?: string | null
  position: number
}

export interface Produto {
  id: string
  categoryId?: string | null
  categoryIds?: string[]
  categoryName?: string | null
  categoryCoverImage?: string | null
  name: string
  slug: string
  customSlug?: string | null
  description?: string | null
  sku?: string | null
  brand?: string | null
  price: number
  compareAtPrice?: number | null
  stock: number
  reviewsCount?: number
  averageRating?: number
  sales?: number
  weightKg?: number | null
  dimensions?: string | null
  technicalSpecs?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  badge?: string | null
  highlights?: string[]
  bullets?: string[]
  applications?: string | null
  faqs?: Array<{ question: string; answer: string }>
  usageAreas?: string[]
  galleryImages?: string[]
  specsTable?: Array<{ label: string; value: string }>
  isFeatured?: boolean
  isActive: boolean
  variants?: ProdutoVariant[]
  images?: ProdutoImage[]
}

export interface ProdutoPayload {
  name: string
  slug?: string
  description?: string
  sku?: string
  brand?: string
  price: number
  compareAtPrice?: number
  stock: number
  weightKg?: number
  dimensions?: string
  technicalSpecs?: string
  seoTitle?: string
  seoDescription?: string
  badge?: string
  highlights?: string[]
  bullets?: string[]
  applications?: string
  faqs?: Array<{ question: string; answer: string }>
  usageAreas?: string[]
  galleryImages?: string[]
  specsTable?: Array<{ label: string; value: string }>
  isFeatured?: boolean
  isActive?: boolean
  categoryIds?: string[]
  variants?: Array<{
    id?: string
    sku?: string
    stock: number
    priceAdjustment?: number
    attributes?: Record<string, string>
    imageUrl?: string
    isActive?: boolean
    position?: number
  }>
}

interface BackendProduct {
  id: string
  category_id?: string
  category_ids?: string[] | null
  category_links?: Array<{
    categoryId?: string
    category?: {
      id?: string
      title?: string
      name?: string
      coverImage?: string | null
    } | null
  }> | null
  category?: {
    id?: string
    title?: string
    name?: string
    coverImage?: string | null
  } | null
  code?: string
  title?: string
  slug?: string | null
  brand?: string | null
  description?: string | null
  specifications?: Record<string, string> | null
  applications?: string | null
  benefits?: string | null
  highlights?: string[] | null
  faqs?: Array<{ question: string; answer: string }> | null
  usage_areas?: string[] | null
  variants?: ProdutoVariant[] | null
  where_use?: Array<{ icon?: string; description?: string }> | null
  carousel_image?: string[] | null
  icons?: string | null
  pricing?: number | string | null
  pix_pricing?: number | string | null
  compare_at_price?: number | string | null
  weight_kg?: number | string | null
  dimensions?: string | null
  seo_title?: string | null
  seo_description?: string | null
  badge?: string | null
  is_featured?: boolean | null
  is_active?: boolean | null
  quantity_stock?: number | null
  reviews?: number | null
  averageRating?: number | string | null
  average_rating?: number | string | null
  reviewsList?: Array<{ rating?: number | string | null }> | null
  sales?: number | null
  createdAt?: string
  updatedAt?: string
}

const PUBLIC_PRODUCTS_CACHE_TTL_MS = 15_000

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const publicProductListCache = new Map<string, CacheEntry<{ items: Produto[]; total: number }>>()
const publicProductListInFlight = new Map<string, Promise<{ items: Produto[]; total: number }>>()
const publicProductByCodeCache = new Map<string, CacheEntry<Produto>>()
const publicProductByCodeInFlight = new Map<string, Promise<Produto>>()

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const response = (error as { response?: { status?: number } }).response
  return typeof response?.status === 'number' ? response.status : undefined
}

function getFreshCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) return null
  return cached.value
}

function getStaleCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  return cache.get(key)?.value ?? null
}

function setCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + PUBLIC_PRODUCTS_CACHE_TTL_MS,
  })
}

async function getOrFetchPublicResource<T>(
  key: string,
  cache: Map<string, CacheEntry<T>>,
  inFlight: Map<string, Promise<T>>,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = getFreshCachedValue(cache, key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = fetcher()
    .then((result) => {
      setCachedValue(cache, key, result)
      return result
    })
    .catch((error) => {
      if (getErrorStatus(error) === 429) {
        const stale = getStaleCachedValue(cache, key)
        if (stale) return stale
      }
      throw error
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, request)
  return request
}

export function clearPublicCatalogCache() {
  publicProductListCache.clear()
  publicProductListInFlight.clear()
  publicProductByCodeCache.clear()
  publicProductByCodeInFlight.clear()
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0
}

function toOptionalNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined
}

function normalizeVariantAttributes(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const entries = Object.entries(value)
    .map(([key, raw]) => [key.trim(), typeof raw === 'string' ? raw.trim() : ''] as const)
    .filter(([key, itemValue]) => key.length > 0 && itemValue.length > 0)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function normalizeVariant(item: unknown, index: number): ProdutoVariant | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null

  const raw = item as Record<string, unknown>
  const stock = toNumber(raw.stock)
  const idValue = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : `variant-${index + 1}`
  const sku = typeof raw.sku === 'string' && raw.sku.trim().length > 0 ? raw.sku.trim() : undefined
  const imageUrl = typeof raw.imageUrl === 'string' && raw.imageUrl.trim().length > 0 ? resolveImageUrl(raw.imageUrl) : undefined
  const priceAdjustment = toOptionalNumber(raw.priceAdjustment)
  const position = toOptionalNumber(raw.position)

  return {
    id: idValue,
    sku,
    stock: Math.max(0, Math.trunc(stock)),
    priceAdjustment,
    attributes: normalizeVariantAttributes(raw.attributes),
    imageUrl,
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
    position,
  }
}

function normalizeVariantList(value: unknown): ProdutoVariant[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => normalizeVariant(item, index))
    .filter((item): item is ProdutoVariant => item !== null)
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
}

function toVariantPayload(payload: Partial<ProdutoVariant>) {
  return {
    id: payload.id,
    sku: payload.sku,
    stock: payload.stock,
    priceAdjustment: payload.priceAdjustment,
    attributes: payload.attributes,
    imageUrl: payload.imageUrl,
    isActive: payload.isActive,
    position: payload.position,
  }
}

export function mapBackendProduct(item: BackendProduct): Produto {
  const title = item.title || ''
  const categoryIds = Array.from(
    new Set(
      [
        ...(Array.isArray(item.category_ids) ? item.category_ids : []),
        ...((item.category_links || []).map((link) => link.categoryId || link.category?.id).filter(Boolean) as string[]),
        item.category_id,
        item.category?.id,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  )

  const categoryName =
    item.category?.title ||
    item.category?.name ||
    item.category_links?.find((link) => link.category?.title || link.category?.name)?.category?.title ||
    item.category_links?.find((link) => link.category?.title || link.category?.name)?.category?.name ||
    null

  const images = (item.carousel_image || []).map((url, index) => ({
    id: `${item.id}-img-${index}`,
    url: resolveImageUrl(url),
    altText: title,
    position: index + 1,
  }))
  const specsTable = Object.entries(item.specifications || {}).map(([label, value]) => ({ label, value: String(value) }))
  const highlights = Array.isArray(item.highlights)
    ? item.highlights.map((entry) => String(entry).trim()).filter(Boolean)
    : (item.benefits ? item.benefits.split('\n').map((entry) => entry.trim()).filter(Boolean) : [])
  const reviewRatings = (item.reviewsList || [])
    .map((review) => toOptionalNumber(review.rating))
    .filter((rating): rating is number => typeof rating === 'number')
  const averageRatingFromList = reviewRatings.length > 0
    ? reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length
    : undefined
  const averageRating =
    toOptionalNumber(item.averageRating) ??
    toOptionalNumber(item.average_rating) ??
    averageRatingFromList
  const reviewsCount = item.reviews ?? reviewRatings.length

  return {
    id: item.id,
    categoryId: item.category_id || categoryIds[0] || item.category?.id || null,
    categoryIds,
    categoryName,
    categoryCoverImage: item.category?.coverImage ? resolveImageUrl(item.category.coverImage) : null,
    name: title,
    slug: item.code || item.slug || slugify(title),
    customSlug: item.slug || null,
    description: item.description || '',
    sku: item.code || '',
    brand: item.brand || 'Tinpavi',
    price: toNumber(item.pricing),
    compareAtPrice: item.compare_at_price == null ? undefined : toNumber(item.compare_at_price),
    stock: item.quantity_stock ?? 0,
    reviewsCount,
    averageRating,
    sales: item.sales ?? 0,
    weightKg: item.weight_kg == null ? undefined : toNumber(item.weight_kg),
    dimensions: item.dimensions || undefined,
    technicalSpecs: specsTable.map((item) => `${item.label}: ${item.value}`).join('\n'),
    seoTitle: item.seo_title || undefined,
    seoDescription: item.seo_description || undefined,
    badge: item.badge || (item.sales ? 'MAIS VENDIDO' : undefined),
    highlights,
    bullets: highlights,
    applications: item.applications || '',
    faqs: item.faqs || [],
    usageAreas: Array.isArray(item.usage_areas)
      ? item.usage_areas
      : (item.where_use || []).map((entry) => entry.description || '').filter(Boolean),
    galleryImages: images.map((image) => image.url),
    specsTable,
    isFeatured: item.is_featured === true,
    isActive: item.is_active ?? true,
    images,
    variants: normalizeVariantList(item.variants),
  }
}

function toBackendPayload(payload: ProdutoPayload | Partial<ProdutoPayload>) {
  const specsFromTable = Object.fromEntries((payload.specsTable || []).filter(item => item.label).map(item => [item.label, item.value]))
  const normalizedCategoryIds = Array.from(new Set((payload.categoryIds || []).map((item) => item.trim()).filter(Boolean)))
  const fallbackCategoryId = normalizedCategoryIds[0]
  const normalizedHighlights = (payload.highlights ?? payload.bullets ?? [])
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    category_id: fallbackCategoryId,
    category_ids: normalizedCategoryIds,
    code: payload.sku && /^[a-fA-F0-9]{8}$/.test(payload.sku) ? payload.sku.toUpperCase() : undefined,
    title: payload.name,
    slug: payload.slug,
    brand: payload.brand ?? 'Tinpavi',
    description: payload.description ?? '',
    benefits: normalizedHighlights.join('\n'),
    highlights: normalizedHighlights,
    faqs: payload.faqs ?? [],
    usage_areas: payload.usageAreas ?? [],
    variants: (payload.variants ?? []).map((item) => toVariantPayload(item)),
    icons: payload.badge ?? 'package',
    pricing: payload.price,
    pix_pricing: payload.compareAtPrice ?? payload.price,
    compare_at_price: payload.compareAtPrice,
    weight_kg: payload.weightKg,
    dimensions: payload.dimensions,
    seo_title: payload.seoTitle,
    seo_description: payload.seoDescription,
    badge: payload.badge,
    is_featured: payload.isFeatured ?? false,
    is_active: payload.isActive ?? true,
    quantity_stock: payload.stock,
    carousel_image: payload.galleryImages ?? [],
    specifications: Object.keys(specsFromTable).length ? specsFromTable : {},
    applications: payload.applications ?? '',
    where_use: undefined,
  }
}

export const produtoService = {
  async listPublic(params: { page?: number; limit?: number; search?: string; category_id?: string; orderBy?: 'pricing' | 'title' | 'createdAt' } = {}): Promise<{ items: Produto[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
      orderBy: params.orderBy ?? 'createdAt',
    })

    if (params.search) query.set('search', params.search)
    if (params.category_id) query.set('category_id', params.category_id)

    const key = query.toString()
    return getOrFetchPublicResource(
      key,
      publicProductListCache,
      publicProductListInFlight,
      async () => {
        const response = await api.getEnvelope<BackendProduct[]>(`/products?${key}`)
        const items = (response.data || []).map(mapBackendProduct)
        return {
          items,
          total: response.meta?.total ?? items.length,
        }
      },
    )
  },

  async getPublicByCode(code: string): Promise<Produto> {
    const normalizedCode = code.trim()
    const key = normalizedCode.toUpperCase()
    return getOrFetchPublicResource(
      key,
      publicProductByCodeCache,
      publicProductByCodeInFlight,
      async () => mapBackendProduct(await api.get<BackendProduct>(`/products/${normalizedCode}`)),
    )
  },

  async list(params: { page?: number; limit?: number; search?: string; lowStockOnly?: boolean } = {}): Promise<{ items: Produto[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    })

    if (params.search) query.set('search', params.search)
    if (params.lowStockOnly) query.set('lowStockOnly', 'true')

    const response = await api.getEnvelope<BackendProduct[]>(`/admin/products?${query.toString()}`)
    const items = (response.data || []).map(mapBackendProduct)
    return {
      items,
      total: response.meta?.total ?? items.length,
    }
  },

  async getById(id: string): Promise<Produto> {
    return mapBackendProduct(await api.get<BackendProduct>(`/admin/products/${id}`))
  },

  async create(payload: ProdutoPayload): Promise<Produto> {
    const created = mapBackendProduct(await api.post<BackendProduct>('/admin/products', toBackendPayload(payload)))
    clearPublicCatalogCache()
    return created
  },

  async update(id: string, payload: Partial<ProdutoPayload>): Promise<Produto> {
    const updated = mapBackendProduct(await api.put<BackendProduct>(`/admin/products/${id}`, toBackendPayload(payload)))
    clearPublicCatalogCache()
    return updated
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`)
    clearPublicCatalogCache()
  },

  async addVariant(id: string, payload: NonNullable<ProdutoPayload['variants']>[number]): Promise<ProdutoVariant> {
    const variant = normalizeVariant(await api.post<ProdutoVariant>(`/admin/products/${id}/variants`, toVariantPayload(payload)), 0) as ProdutoVariant
    clearPublicCatalogCache()
    return variant
  },

  async listVariants(id: string): Promise<ProdutoVariant[]> {
    const response = await api.getEnvelope<unknown[]>(`/admin/products/${id}/variants`)
    return normalizeVariantList(response.data)
  },

  async updateVariant(id: string, variantId: string, payload: Partial<ProdutoVariant>): Promise<ProdutoVariant> {
    const variant = normalizeVariant(await api.put<ProdutoVariant>(`/admin/products/${id}/variants/${variantId}`, toVariantPayload(payload)), 0) as ProdutoVariant
    clearPublicCatalogCache()
    return variant
  },

  async deleteVariant(id: string, variantId: string): Promise<void> {
    await api.delete(`/admin/products/${id}/variants/${variantId}`)
    clearPublicCatalogCache()
  },

  async uploadImage(id: string, file: File, meta: { altText?: string; position?: number } = {}): Promise<ProdutoImage> {
    const formData = new FormData()
    formData.append('image', file)
    if (meta.altText) formData.append('altText', meta.altText)
    if (typeof meta.position === 'number') formData.append('position', String(meta.position))
    const uploaded = await api.post<{ id?: string; url: string; altText?: string | null; position?: number }>(`/admin/products/${id}/images`, formData)
    const image = {
      id: uploaded.id || crypto.randomUUID(),
      url: resolveImageUrl(uploaded.url),
      altText: uploaded.altText ?? meta.altText,
      position: uploaded.position ?? meta.position ?? 1,
    }
    clearPublicCatalogCache()
    return image
  },

  async removeImage(id: string, imageId: string): Promise<void> {
    await api.delete(`/admin/products/${id}/images/${imageId}`)
    clearPublicCatalogCache()
  },

  async reorderImages(id: string, orderedIds: string[]): Promise<void> {
    await api.patch(`/admin/products/${id}/images/reorder`, { orderedIds })
    clearPublicCatalogCache()
  },
}
