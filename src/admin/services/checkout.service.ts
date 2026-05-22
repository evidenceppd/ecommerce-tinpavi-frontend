import { api } from './api'

export interface CheckoutItemPayload {
  productId: string
  variantId?: string
  quantity: number
}

export interface CheckoutShippingAddressPayload {
  zipCode: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  country: string
}

export type CheckoutAddressPayload =
  | { shippingAddressId: string; shippingAddress?: never }
  | { shippingAddress: CheckoutShippingAddressPayload; shippingAddressId?: never }

export type CheckoutOrderPayload = CheckoutAddressPayload & {
  items: CheckoutItemPayload[]
  quoteId: string
  saveAddress?: boolean
  setAsDefaultAddress?: boolean
  couponCode?: string
}

export interface CouponValidationResponse {
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  discountAmount: number
  totalAmount: number
}

export interface ShippingQuoteOption {
  quoteId: string
  carrier: string
  service: string
  price: number
  estimatedDays: number
}

export interface ShippingQuoteResponse {
  source: 'provider' | 'fallback'
  options: ShippingQuoteOption[]
}

export interface CheckoutOrder {
  id: string
  status: string
  paymentStatus?: string
  totalAmount?: number | string
  total?: number | string
}

export const checkoutService = {
  quoteShipping(payload: CheckoutAddressPayload & { items: CheckoutItemPayload[] }): Promise<ShippingQuoteResponse> {
    return api.post<ShippingQuoteResponse>('/me/shipping/quotes', payload)
  },

  createOrder(payload: CheckoutOrderPayload): Promise<CheckoutOrder> {
    return api.post<CheckoutOrder>('/orders', payload)
  },

  validateCoupon(payload: { code: string; subtotal: number; shippingCost: number }): Promise<CouponValidationResponse> {
    return api.post<CouponValidationResponse>('/orders/coupons/validate', payload)
  },
}
