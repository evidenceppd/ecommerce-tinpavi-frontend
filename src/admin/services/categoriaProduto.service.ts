import { api } from './api'

export interface CategoriaProduto {
  id: string
  name: string
  slug?: string
  coverImage?: string | null
  description?: string
  parentId?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
}

export interface CategoriaProdutoPayload {
  name: string
  slug?: string
  coverImage?: string | null
  description?: string
  parentId?: string
  metaTitle?: string
  metaDescription?: string
}

interface BackendCategory {
  id: string
  title: string
  coverImage?: string | null
  createdAt?: string
  updatedAt?: string
}

type CategoriaListParams = { page?: number; limit?: number; search?: string }
type CategoriaListResponse = { items: CategoriaProduto[]; total: number }

const CATEGORY_LIST_CACHE_TTL_MS = 30_000
const categoryListCache = new Map<string, { expiresAt: number; value: CategoriaListResponse }>()
const categoryListInFlight = new Map<string, Promise<CategoriaListResponse>>()

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function mapCategory(item: BackendCategory): CategoriaProduto {
  return {
    id: item.id,
    name: item.title,
    slug: slugify(item.title),
    coverImage: item.coverImage || null,
    description: '',
    parentId: null,
  }
}

function buildListQuery(params: CategoriaListParams): string {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  })

  if (params.search) query.set('search', params.search)

  return query.toString()
}

function toListResponse(response: Awaited<ReturnType<typeof api.getEnvelope<BackendCategory[]>>>): CategoriaListResponse {
  const items = (response.data || []).map(mapCategory)
  return {
    items,
    total: response.meta?.total ?? items.length,
  }
}

function buildCacheKey(scope: 'admin' | 'public', query: string): string {
  return `${scope}:${query}`
}

function getCachedCategoryList(cacheKey: string): CategoriaListResponse | null {
  const cached = categoryListCache.get(cacheKey)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    categoryListCache.delete(cacheKey)
    return null
  }
  return cached.value
}

function setCachedCategoryList(cacheKey: string, value: CategoriaListResponse) {
  categoryListCache.set(cacheKey, {
    expiresAt: Date.now() + CATEGORY_LIST_CACHE_TTL_MS,
    value,
  })
}

function clearCategoryListCache() {
  categoryListCache.clear()
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const maybeResponse = (error as { response?: { status?: number } }).response
  return typeof maybeResponse?.status === 'number' ? maybeResponse.status : undefined
}

async function getOrFetchCategoryList(cacheKey: string, fetcher: () => Promise<CategoriaListResponse>): Promise<CategoriaListResponse> {
  const cached = getCachedCategoryList(cacheKey)
  if (cached) return cached

  const inFlight = categoryListInFlight.get(cacheKey)
  if (inFlight) return inFlight

  const promise = fetcher()
    .then((result) => {
      setCachedCategoryList(cacheKey, result)
      return result
    })
    .finally(() => {
      categoryListInFlight.delete(cacheKey)
    })

  categoryListInFlight.set(cacheKey, promise)
  return promise
}

async function listPublicCategories(params: CategoriaListParams = {}): Promise<CategoriaListResponse> {
  const query = buildListQuery(params)
  const cacheKey = buildCacheKey('public', query)

  return getOrFetchCategoryList(cacheKey, async () => {
    const response = await api.getEnvelope<BackendCategory[]>(`/categories?${query}`)
    return toListResponse(response)
  })
}

async function listAdminCategories(params: CategoriaListParams = {}): Promise<CategoriaListResponse> {
  const query = buildListQuery(params)
  const adminCacheKey = buildCacheKey('admin', query)

  return getOrFetchCategoryList(adminCacheKey, async () => {
    try {
      const response = await api.getEnvelope<BackendCategory[]>(`/admin/categories?${query}`)
      return toListResponse(response)
    } catch (error) {
      const status = getErrorStatus(error)
      if (status === 429) {
        const cachedAdmin = getCachedCategoryList(adminCacheKey)
        if (cachedAdmin) return cachedAdmin
      }
      console.warn('Falha ao carregar categorias administrativas. Usando categorias publicas como fallback.', error)
      return listPublicCategories(params)
    }
  })
}

function toBackendPayload(payload: Partial<CategoriaProdutoPayload>): Partial<BackendCategory> {
  const data: Partial<BackendCategory> = {}
  if (payload.name !== undefined) data.title = payload.name
  if (payload.coverImage !== undefined) data.coverImage = payload.coverImage
  return data
}

export const categoriaProdutoService = {
  async listPublic(params: CategoriaListParams = {}): Promise<CategoriaListResponse> {
    return listPublicCategories(params)
  },

  async list(params: CategoriaListParams = {}): Promise<CategoriaListResponse> {
    return listAdminCategories(params)
  },

  async create(payload: CategoriaProdutoPayload): Promise<CategoriaProduto> {
    const created = mapCategory(await api.post<BackendCategory>('/admin/categories', toBackendPayload(payload)))
    clearCategoryListCache()
    return created
  },

  async update(id: string, payload: Partial<CategoriaProdutoPayload>): Promise<CategoriaProduto> {
    const updated = mapCategory(await api.put<BackendCategory>(`/admin/categories/${id}`, toBackendPayload(payload)))
    clearCategoryListCache()
    return updated
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`)
    clearCategoryListCache()
  },
}
