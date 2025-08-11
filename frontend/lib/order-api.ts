// Order and Cart API Service
import { apiService, ApiResponse, PaginatedResponse, buildQueryString } from '@/lib/api'

// Order types
export interface RentalOrder {
  id: string
  orderNumber: string
  customerId: string
  status: 'confirmed' | 'reserved' | 'pickup' | 'active' | 'returned' | 'cancelled'
  items: RentalOrderItem[]
  startDate: string
  endDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
  deliveryAddress?: string
  pickupDate?: string
  returnDate?: string
  lateFees?: number
}

export interface RentalOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  startDate: string
  endDate: string
  duration: {
    value: number
    unit: 'hour' | 'day' | 'week' | 'month'
  }
}

export interface RentalQuote {
  id: string
  quoteNumber: string
  customerId: string
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled'
  items: RentalQuoteItem[]
  startDate: string
  endDate: string
  totalAmount: number
  validUntil: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RentalQuoteItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  duration: {
    value: number
    unit: 'hour' | 'day' | 'week' | 'month'
  }
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  quantity: number
  startDate: string
  endDate: string
  pricing: {
    hourly?: number
    daily?: number
    weekly?: number
    monthly?: number
  }
  product: any // Full product data
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string
    quantity: number
    duration: {
      value: number
      unit: 'hour' | 'day' | 'week' | 'month'
    }
  }>
  startDate: string
  endDate: string
  deliveryAddress?: string
  notes?: string
}

export interface CreateQuoteRequest extends CreateOrderRequest {
  validUntil?: string
}

export interface AvailabilityCheck {
  productId: string
  quantity: number
  startDate: string
  endDate: string
}

export interface AvailabilityResult {
  productId: string
  isAvailable: boolean
  availableQuantity: number
  nextAvailableDate?: string
  alternatives?: Array<{
    startDate: string
    endDate: string
    availableQuantity: number
  }>
}

export interface OrderFilters {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
  customerId?: string
}

// Order API Service
export class OrderApiService {

  // Get rental orders
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<RentalOrder>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/orders/orders/${queryString}`) as Promise<PaginatedResponse<RentalOrder>>
  }

  // Get single order details
  async getOrder(id: string): Promise<ApiResponse<RentalOrder>> {
    return apiService.get(`/orders/orders/${id}/`)
  }

  // Create rental order
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<RentalOrder>> {
    return apiService.post('/orders/orders/', orderData)
  }

  // Update order
  async updateOrder(id: string, orderData: Partial<CreateOrderRequest>): Promise<ApiResponse<RentalOrder>> {
    return apiService.put(`/orders/orders/${id}/`, orderData)
  }

  // Confirm pickup
  async confirmPickup(id: string, data: {
    pickupDate: string
    deliveredBy?: string
    notes?: string
  }): Promise<ApiResponse<RentalOrder>> {
    return apiService.post(`/orders/orders/${id}/confirm_pickup/`, data)
  }

  // Confirm return
  async confirmReturn(id: string, data: {
    returnDate: string
    condition?: 'good' | 'damaged' | 'lost'
    notes?: string
    lateFees?: number
  }): Promise<ApiResponse<RentalOrder>> {
    return apiService.post(`/orders/orders/${id}/confirm_return/`, data)
  }

  // Check order availability
  async checkOrderAvailability(id: string): Promise<ApiResponse<{
    isAvailable: boolean
    issues: string[]
  }>> {
    return apiService.get(`/orders/orders/${id}/check_availability/`)
  }

  // Get overdue orders
  async getOverdueOrders(): Promise<ApiResponse<RentalOrder[]>> {
    return apiService.get('/orders/orders/overdue_orders/')
  }

  // Get quotations
  async getQuotations(filters: OrderFilters = {}): Promise<PaginatedResponse<RentalQuote>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/orders/quotes/${queryString}`) as Promise<PaginatedResponse<RentalQuote>>
  }

  // Get single quotation details
  async getQuotation(id: string): Promise<ApiResponse<RentalQuote>> {
    return apiService.get(`/orders/quotes/${id}/`)
  }

  // Create quotation
  async createQuotation(quoteData: CreateQuoteRequest): Promise<ApiResponse<RentalQuote>> {
    return apiService.post('/orders/quotes/', quoteData)
  }

  // Update quotation
  async updateQuotation(id: string, quoteData: Partial<CreateQuoteRequest>): Promise<ApiResponse<RentalQuote>> {
    return apiService.put(`/orders/quotes/${id}/`, quoteData)
  }

  // Convert quotation to order
  async convertQuoteToOrder(id: string): Promise<ApiResponse<RentalOrder>> {
    return apiService.post(`/orders/quotes/${id}/convert_to_order/`)
  }

  // Send quotation via email
  async sendQuotation(id: string, email?: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post(`/orders/quotes/${id}/send_quote/`, { email })
  }

  // Delete quotation
  async deleteQuotation(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/orders/quotes/${id}/`)
  }

  // Calculate pricing for items
  async calculatePricing(items: Array<{
    productId: string
    quantity: number
    duration: {
      value: number
      unit: 'hour' | 'day' | 'week' | 'month'
    }
  }>): Promise<ApiResponse<{
    items: Array<{
      productId: string
      unitPrice: number
      totalPrice: number
      discounts?: Array<{ type: string; amount: number }>
    }>
    subtotal: number
    taxes: number
    discounts: number
    total: number
  }>> {
    return apiService.get(`/orders/quotes/calculate_pricing/?items=${encodeURIComponent(JSON.stringify(items))}`)
  }

  // Check availability for multiple items
  async checkAvailability(checks: AvailabilityCheck[]): Promise<ApiResponse<AvailabilityResult[]>> {
    return apiService.post('/orders/availability/check/', { items: checks })
  }

  // Batch availability check
  async batchCheckAvailability(checks: AvailabilityCheck[]): Promise<ApiResponse<AvailabilityResult[]>> {
    return apiService.post('/orders/availability/batch_check/', { items: checks })
  }

  // Get availability calendar
  async getAvailabilityCalendar(params: {
    productIds?: string[]
    startDate: string
    endDate: string
  }): Promise<ApiResponse<{
    [productId: string]: {
      [date: string]: {
        available: number
        total: number
        reservations: number
      }
    }
  }>> {
    const queryString = buildQueryString(params)
    return apiService.get(`/orders/availability/calendar/${queryString}`)
  }

  // Find alternative dates
  async findAlternatives(data: {
    productId: string
    quantity: number
    preferredStartDate: string
    duration: number
    unit: 'hour' | 'day' | 'week' | 'month'
    maxAlternatives?: number
  }): Promise<ApiResponse<Array<{
    startDate: string
    endDate: string
    availableQuantity: number
    score: number
  }>>> {
    return apiService.post('/orders/availability/alternatives/', data)
  }

  // Get reservations
  async getReservations(filters: {
    page?: number
    limit?: number
    productId?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<PaginatedResponse<any>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/orders/reservations/${queryString}`) as Promise<PaginatedResponse<any>>
  }

  // Get upcoming returns
  async getUpcomingReturns(days = 7): Promise<ApiResponse<RentalOrder[]>> {
    return apiService.get(`/orders/reservations/upcoming_returns/?days=${days}`)
  }

  // Get rental contracts
  async getContracts(filters: {
    page?: number
    limit?: number
    orderId?: string
  } = {}): Promise<PaginatedResponse<any>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/orders/contracts/${queryString}`) as Promise<PaginatedResponse<any>>
  }

  // Get contract details
  async getContract(id: string): Promise<ApiResponse<any>> {
    return apiService.get(`/orders/contracts/${id}/`)
  }

  // Sign contract
  async signContract(id: string, signature: string): Promise<ApiResponse<any>> {
    return apiService.post(`/orders/contracts/${id}/sign_contract/`, { signature })
  }
}

// Cart Management (Client-side with localStorage)
export class CartService {
  private readonly CART_KEY = 'rental_cart'

  // Get cart items from localStorage
  getCartItems(): CartItem[] {
    if (typeof window === 'undefined') return []
    
    try {
      const cartData = localStorage.getItem(this.CART_KEY)
      return cartData ? JSON.parse(cartData) : []
    } catch {
      return []
    }
  }

  // Add item to cart
  addToCart(item: Omit<CartItem, 'id'>): CartItem {
    const cartItems = this.getCartItems()
    const newItem: CartItem = {
      ...item,
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Check if product already exists in cart
    const existingIndex = cartItems.findIndex(cartItem => cartItem.productId === item.productId)
    
    if (existingIndex >= 0) {
      // Update existing item
      cartItems[existingIndex] = { ...cartItems[existingIndex], ...newItem, id: cartItems[existingIndex].id }
    } else {
      // Add new item
      cartItems.push(newItem)
    }
    
    this.saveCart(cartItems)
    return newItem
  }

  // Update cart item
  updateCartItem(id: string, updates: Partial<CartItem>): CartItem | null {
    const cartItems = this.getCartItems()
    const index = cartItems.findIndex(item => item.id === id)
    
    if (index >= 0) {
      cartItems[index] = { ...cartItems[index], ...updates }
      this.saveCart(cartItems)
      return cartItems[index]
    }
    
    return null
  }

  // Remove item from cart
  removeFromCart(id: string): boolean {
    const cartItems = this.getCartItems()
    const filtered = cartItems.filter(item => item.id !== id)
    
    if (filtered.length !== cartItems.length) {
      this.saveCart(filtered)
      return true
    }
    
    return false
  }

  // Clear entire cart
  clearCart(): void {
    this.saveCart([])
  }

  // Get cart item count
  getCartItemCount(): number {
    return this.getCartItems().length
  }

  // Calculate cart total
  calculateCartTotal(): number {
    const items = this.getCartItems()
    return items.reduce((total, item) => {
      const days = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24))
      const price = item.pricing.daily || 0
      return total + (price * item.quantity * days)
    }, 0)
  }

  // Check if product is in cart
  isProductInCart(productId: string): boolean {
    return this.getCartItems().some(item => item.productId === productId)
  }

  // Save cart to localStorage
  private saveCart(items: CartItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.CART_KEY, JSON.stringify(items))
    }
  }
}

// Create and export singleton instances
export const orderApi = new OrderApiService()
export const cartService = new CartService()

// Export defaults
export default orderApi
