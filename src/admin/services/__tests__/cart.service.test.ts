import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  resolveImageUrl: vi.fn((path: string) => path.startsWith('/') ? `http://localhost:3000${path}` : path),
}))

import { api } from '../api'
import { cartService } from '../cart.service'

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cartService.clearCache()
  })

  it('dedupes concurrent get requests for /me/cart', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined

    vi.mocked(api.get).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }) as Promise<never>,
    )

    const first = cartService.get()
    const second = cartService.get()

    expect(api.get).toHaveBeenCalledTimes(1)

    resolveRequest?.({
      id: 'cart-1',
      items: [],
      itemCount: 0,
      subtotal: 0,
    })

    await expect(first).resolves.toMatchObject({ id: 'cart-1' })
    await expect(second).resolves.toMatchObject({ id: 'cart-1' })
  })

  it('reuses cached cart after mutation to avoid immediate refetch', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'cart-2',
      items: [
        {
          productId: 'p1',
          name: 'Produto',
          code: 'ABC',
          quantity: 1,
          unitPrice: 10,
          pixPrice: 10,
          total: 10,
          image: null,
          stock: 2,
        },
      ],
      itemCount: 1,
      subtotal: 10,
    } as never)

    await cartService.addItem('p1', 1)
    const cached = await cartService.get()

    expect(api.post).toHaveBeenCalledWith('/me/cart/items', { productId: 'p1', quantity: 1 })
    expect(api.get).not.toHaveBeenCalled()
    expect(cached.itemCount).toBe(1)
  })

  it('normalizes relative product images returned by the API', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'cart-3',
      items: [
        {
          productId: 'p1',
          name: 'Mini Tachao',
          code: 'ABC',
          quantity: 1,
          unitPrice: 49.9,
          pixPrice: 49.9,
          total: 49.9,
          image: '/uploads/products/mini-tachao.png',
          stock: 2,
        },
      ],
      itemCount: 1,
      subtotal: 49.9,
    } as never)

    const cart = await cartService.get({ forceRefresh: true })

    expect(cart.items[0]?.image).toBe('http://localhost:3000/uploads/products/mini-tachao.png')
  })
})
