import { api, resolveImageUrl } from './api'

export interface CartItem {
  productId: string
  variantId?: string
  variantName?: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  pixPrice: number
  total: number
  image: string | null
  stock: number
}

export interface Cart {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: number
}

export interface CartProductSnapshot {
  name: string
  code: string
  unitPrice: number
  pixPrice?: number
  image?: string | null
  stock: number
  variantName?: string
}

const CART_CACHE_TTL_MS = 5_000
const GUEST_CART_STORAGE_KEY = 'tinpavi_guest_cart'
let cartCache: { value: Cart; expiresAt: number } | null = null
let cartInFlight: Promise<Cart> | null = null

function setCartCache(cart: Cart) {
  cartCache = {
    value: cart,
    expiresAt: Date.now() + CART_CACHE_TTL_MS,
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<Cart>('cart:updated', { detail: cart }))
  }
}

function clearCartCache() {
  cartCache = null
}

function getCachedCart(): Cart | null {
  if (!cartCache) return null
  if (cartCache.expiresAt <= Date.now()) return null
  return cartCache.value
}

function createEmptyGuestCart(): Cart {
  return { id: 'guest-cart', items: [], itemCount: 0, subtotal: 0 }
}

function normalizeCart(cart: Cart): Cart {
  const items = cart.items.map((item) => ({
    ...item,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    pixPrice: Number(item.pixPrice) || Number(item.unitPrice) || 0,
    total: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    image: item.image ? resolveImageUrl(item.image) : null,
  }))
  return {
    id: cart.id || 'guest-cart',
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.total, 0),
  }
}

function readGuestCart(): Cart {
  if (typeof localStorage === 'undefined') return createEmptyGuestCart()
  const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY)
  if (!raw) return createEmptyGuestCart()
  try {
    return normalizeCart(JSON.parse(raw) as Cart)
  } catch {
    return createEmptyGuestCart()
  }
}

function writeGuestCart(cart: Cart): Cart {
  const normalized = normalizeCart(cart)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalized))
  }
  setCartCache(normalized)
  return normalized
}

function removeGuestCart() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY)
  }
}

function addGuestItem(productId: string, quantity: number, variantId: string | undefined, product: CartProductSnapshot): Cart {
  const cart = readGuestCart()
  const existing = cart.items.find((item) => item.productId === productId && (item.variantId ?? '') === (variantId ?? ''))
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stock)
  const nextItem: CartItem = {
    productId,
    variantId,
    variantName: product.variantName,
    name: product.name,
    code: product.code,
    quantity: nextQuantity,
    unitPrice: product.unitPrice,
    pixPrice: product.pixPrice ?? product.unitPrice,
    total: product.unitPrice * nextQuantity,
    image: product.image ?? null,
    stock: product.stock,
  }
  const items = existing
    ? cart.items.map((item) => item.productId === productId && (item.variantId ?? '') === (variantId ?? '') ? nextItem : item)
    : [...cart.items, nextItem]
  return writeGuestCart({ ...cart, items })
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const response = (error as { response?: { status?: number } }).response
  return response?.status
}

export const cartService = {
  async get(options: { forceRefresh?: boolean } = {}): Promise<Cart> {
    if (!options.forceRefresh) {
      const cached = getCachedCart()
      if (cached) return cached
      if (cartInFlight) return cartInFlight
    }

    const request = api.get<Cart>('/me/cart')
      .then((cart) => {
        const normalized = normalizeCart(cart)
        setCartCache(normalized)
        return normalized
      })
      .catch((error) => {
        clearCartCache()
        throw error
      })
      .finally(() => {
        if (cartInFlight === request) {
          cartInFlight = null
        }
      })

    if (!options.forceRefresh) {
      cartInFlight = request
    }

    return request
  },

  async addItem(productId: string, quantity = 1, variantId?: string, product?: CartProductSnapshot): Promise<Cart> {
    try {
      const cart = await api.post<Cart>('/me/cart/items', { productId, quantity, ...(variantId ? { variantId } : {}) })
      const normalized = normalizeCart(cart)
      setCartCache(normalized)
      return normalized
    } catch (error) {
      if (getErrorStatus(error) === 401 && product) {
        return addGuestItem(productId, quantity, variantId, product)
      }
      throw error
    }
  },

  async setQuantity(productId: string, quantity: number): Promise<Cart> {
    const cart = normalizeCart(await api.patch<Cart>(`/me/cart/items/${productId}`, { quantity }))
    setCartCache(cart)
    return cart
  },

  async removeItem(productId: string, variantId?: string): Promise<Cart> {
    try {
      const suffix = variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''
      const cart = normalizeCart(await api.delete<Cart>(`/me/cart/items/${productId}${suffix}`))
      setCartCache(cart)
      return cart
    } catch (error) {
      if (getErrorStatus(error) === 401) {
        const cart = readGuestCart()
        return writeGuestCart({
          ...cart,
          items: cart.items.filter((item) => !(item.productId === productId && (item.variantId ?? '') === (variantId ?? ''))),
        })
      }
      throw error
    }
  },

  async clear(): Promise<Cart> {
    const cart = normalizeCart(await api.delete<Cart>('/me/cart'))
    setCartCache(cart)
    return cart
  },

  clearCache(): void {
    clearCartCache()
  },

  getGuestCart(): Cart {
    return readGuestCart()
  },

  hasGuestItems(): boolean {
    return readGuestCart().items.length > 0
  },

  async syncGuestCartToServer(): Promise<void> {
    const guestCart = readGuestCart()
    if (guestCart.items.length === 0) return
    for (const item of guestCart.items) {
      await api.post<Cart>('/me/cart/items', {
        productId: item.productId,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
      })
    }
    removeGuestCart()
    clearCartCache()
  },
}
