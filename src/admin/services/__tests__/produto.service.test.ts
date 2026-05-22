import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    getEnvelope: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
  resolveImageUrl: vi.fn((value: string) => value),
}))

import { api } from '../api'
import { produtoService } from '../produto.service'

describe('produtoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('list returns typed paginated payload for admin products', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [
        {
          id: 'p1',
          code: 'ABCDEF12',
          title: 'Produto',
          pricing: 10,
          quantity_stock: 2,
          is_active: true,
          variants: [],
        },
      ],
      meta: { total: 1 },
    } as never)

    const result = await produtoService.list({ page: 2, limit: 10, search: 'pro' })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/products?page=2&limit=10&search=pro')
    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe('p1')
  })

  it('listVariants normalizes variants from admin endpoint', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [
        {
          id: 'v1',
          sku: 'AMR-G',
          stock: 3,
          priceAdjustment: 5,
          attributes: { cor: 'amarelo' },
          imageUrl: '/uploads/variant.png',
          isActive: true,
          position: 1,
        },
      ],
      meta: { total: 1 },
    } as never)

    const result = await produtoService.listVariants('p1')

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/products/p1/variants')
    expect(result[0]).toMatchObject({
      id: 'v1',
      sku: 'AMR-G',
      stock: 3,
      priceAdjustment: 5,
      attributes: { cor: 'amarelo' },
      isActive: true,
      position: 1,
    })
  })

  it('updateVariant sends payload to dedicated endpoint', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({
      id: 'v1',
      sku: 'AMR-G',
      stock: 8,
      priceAdjustment: 10,
      attributes: { cor: 'amarelo' },
      imageUrl: '/uploads/variant.png',
      isActive: true,
      position: 1,
    } as never)

    const result = await produtoService.updateVariant('p1', 'v1', { stock: 8 })

    expect(api.put).toHaveBeenCalledWith('/admin/products/p1/variants/v1', {
      id: undefined,
      sku: undefined,
      stock: 8,
      priceAdjustment: undefined,
      attributes: undefined,
      imageUrl: undefined,
      isActive: undefined,
      position: undefined,
    })
    expect(result).toMatchObject({ id: 'v1', stock: 8 })
  })

  it('reorderImages sends orderedIds to backend contract', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce(undefined as never)

    await produtoService.reorderImages('p1', ['img2', 'img1'])

    expect(api.patch).toHaveBeenCalledWith('/admin/products/p1/images/reorder', {
      orderedIds: ['img2', 'img1'],
    })
  })

  it('uploadImage posts FormData payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'img-1', url: '/uploads/1.png', position: 0 } as never)

    const file = new File(['content'], 'photo.png', { type: 'image/png' })
    const result = await produtoService.uploadImage('p1', file, { altText: 'capa', position: 1 })

    const call = vi.mocked(api.post).mock.calls[0]
    expect(call?.[0]).toBe('/admin/products/p1/images')
    expect(call?.[1]).toBeInstanceOf(FormData)
    expect(result.id).toBe('img-1')
  })

  it('dedupes concurrent listPublic requests with same query', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined

    vi.mocked(api.getEnvelope).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }) as Promise<never>,
    )

    const first = produtoService.listPublic({ limit: 12, orderBy: 'createdAt' })
    const second = produtoService.listPublic({ limit: 12, orderBy: 'createdAt' })

    expect(api.getEnvelope).toHaveBeenCalledTimes(1)

    resolveRequest?.({
      data: [{ id: 'p-public-1', code: 'ABCDEF12', title: 'Produto publico', pricing: 100, quantity_stock: 10, is_active: true }],
      meta: { total: 1 },
    })

    await expect(first).resolves.toMatchObject({ total: 1 })
    await expect(second).resolves.toMatchObject({ total: 1 })
  })

  it('returns stale cached product when /products/:code receives 429', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-14T10:00:00.000Z'))

    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'p-rate-1',
      code: 'RATE0001',
      title: 'Produto cacheado',
      pricing: 100,
      quantity_stock: 5,
      is_active: true,
      variants: [],
    } as never)

    const initial = await produtoService.getPublicByCode('RATE0001')
    expect(initial.name).toBe('Produto cacheado')

    vi.setSystemTime(new Date('2026-05-14T10:00:16.000Z'))
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 429 } } as never)

    const fallback = await produtoService.getPublicByCode('RATE0001')

    expect(api.get).toHaveBeenCalledTimes(2)
    expect(fallback.name).toBe('Produto cacheado')
  })
})
