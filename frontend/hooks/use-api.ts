// React hooks for API integration
import { useState, useEffect, useCallback, useMemo } from 'react'
import { authApi, User } from '@/lib/auth-api'
import { productApi, Product, ProductFilters } from '@/lib/product-api'
import { orderApi, cartService, RentalOrder, RentalQuote, CartItem } from '@/lib/order-api'
import { handleApiError } from '@/lib/api'

// Auth hooks
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      console.log('useAuth: Checking authentication on mount')
      setIsLoading(true)
      try {
        const storedUser = authApi.getCurrentUser()
        const isAuth = authApi.isAuthenticated()
        
        console.log('useAuth: Stored data check', { 
          storedUser: !!storedUser, 
          isAuth, 
          hasToken: !!authApi.getAuthToken() 
        })
        
        if (isAuth && storedUser) {
          console.log('useAuth: Found stored auth, setting authenticated state')
          // Just use the stored user without backend verification for now
          setUser(storedUser)
          setIsAuthenticated(true)
          
          // Optionally verify token in the background
          authApi.getProfile().then(response => {
            if (response.success && response.data) {
              console.log('useAuth: Profile verification successful, updating user data')
              setUser(response.data)
            } else {
              console.log('useAuth: Profile verification failed but keeping user logged in')
            }
          }).catch(error => {
            console.log('useAuth: Profile verification error:', error)
          })
        } else {
          console.log('useAuth: No valid stored auth found')
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('useAuth: Auth check failed:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        console.log('useAuth: Auth check complete')
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    console.log('Login attempt started with:', email)
    setIsLoading(true)
    try {
      const response = await authApi.login({ email, password })
      console.log('Login response:', response)
      if (response.success && response.data) {
        console.log('Login successful, setting user state')
        setUser(response.data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        console.log('Login failed:', response.error)
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: any) => {
    setIsLoading(true)
    try {
      const response = await authApi.register(userData)
      if (response.success && response.data) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    if (!user) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await authApi.updateProfile(userData)
      if (response.success && response.data) {
        setUser(response.data)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Profile update failed. Please try again.' 
      }
    }
  }, [user])

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  }
}

import { getDeliveryAnalytics, getInventoryAnalytics } from '@/lib/analytics-api'

// Product management hook
export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.category,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit,
    filters.minPrice,
    filters.maxPrice,
    filters.brands,
    filters.colors,
    filters.conditions,
    filters.isRentable,
    filters.availability
  ])

  const fetchProducts = useCallback(async (newFilters: ProductFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await productApi.getProducts({ ...memoizedFilters, ...newFilters })
      console.log('useProducts: Raw API response:', response)
      
      if (response.success && response.data) {
        // Handle backend response format: data.products array and data.pagination object
        const products = response.data.products || response.data.items || []
        const pagination = response.data.pagination as any || {}
        
        console.log('useProducts: Parsed products:', products.length, 'items')
        console.log('useProducts: Parsed pagination:', pagination)
        
        setProducts(products)
        setPagination({
          total: pagination.total || (response.data as any).total || 0,
          page: pagination.page || (response.data as any).page || 1,
          totalPages: pagination.total_pages || (response.data as any).totalPages || 0,
          hasNext: pagination.has_next || (response.data as any).hasNext || false,
          hasPrev: pagination.has_prev || (response.data as any).hasPrev || false
        })
      } else {
        console.log('useProducts: API response failed:', response)
        setError('Failed to fetch products')
        setProducts([])
      }
    } catch (err) {
      setError('Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [memoizedFilters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const refresh = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  const loadMore = useCallback(() => {
    if (pagination.hasNext) {
      fetchProducts({ page: pagination.page + 1 })
    }
  }, [pagination.hasNext, pagination.page, fetchProducts])

  return {
    products,
    loading,
    error,
    pagination,
    refresh,
    loadMore,
    fetchProducts
  }
}

// Single product hook
export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await productApi.getProduct(id)
        if (response.success && response.data) {
          setProduct(response.data.product)
          setAvailability(response.data.availability)
        } else {
          setError(handleApiError(response.error))
          setProduct(null)
          setAvailability(null)
        }
      } catch (err) {
        setError('Failed to fetch product')
        setProduct(null)
        setAvailability(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const checkAvailability = useCallback(async (startDate: string, endDate: string, quantity = 1) => {
    if (!id) return null
    
    try {
      const response = await productApi.checkAvailability(id, { startDate, endDate, quantity })
      if (response.success && response.data) {
        setAvailability(response.data)
        return response.data
      }
    } catch (err) {
      console.error('Availability check failed:', err)
    }
    return null
  }, [id])

  return {
    product,
    availability,
    loading,
    error,
    checkAvailability
  }
}

// Categories hook
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await productApi.getCategories()
        if (response.success && response.data) {
          setCategories(response.data)
        } else {
          setError(handleApiError(response.error))
          setCategories([])
        }
      } catch (err) {
        setError('Failed to fetch categories')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

// Orders hook
export function useOrders(filters: any = {}) {
  const [orders, setOrders] = useState<RentalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchOrders = useCallback(async (newFilters: any = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await orderApi.getOrders({ ...filters, ...newFilters })
      if (response.success && response.data) {
        setOrders(response.data.items || [])
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 0,
          hasNext: response.data.hasNext || false,
          hasPrev: response.data.hasPrev || false
        })
      } else {
        setError('Failed to fetch orders')
        setOrders([])
      }
    } catch (err) {
      setError('Failed to fetch orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const createOrder = useCallback(async (orderData: any) => {
    try {
      const response = await orderApi.createOrder(orderData)
      if (response.success && response.data) {
        await fetchOrders() // Refresh orders list
        return { success: true, data: response.data }
      } else {
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to create order' 
      }
    }
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createOrder
  }
}

// Cart hook
export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [total, setTotal] = useState(0)

  // Load cart from localStorage on mount
  useEffect(() => {
    const items = cartService.getCartItems()
    setCartItems(items)
    setItemCount(cartService.getCartItemCount())
    setTotal(cartService.calculateCartTotal())
  }, [])

  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    const newItem = cartService.addToCart(item)
    const updatedItems = cartService.getCartItems()
    setCartItems(updatedItems)
    setItemCount(cartService.getCartItemCount())
    setTotal(cartService.calculateCartTotal())
    return newItem
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
    const updatedItem = cartService.updateCartItem(id, updates)
    if (updatedItem) {
      const updatedItems = cartService.getCartItems()
      setCartItems(updatedItems)
      setTotal(cartService.calculateCartTotal())
    }
    return updatedItem
  }, [])

  const removeItem = useCallback((id: string) => {
    const removed = cartService.removeFromCart(id)
    if (removed) {
      const updatedItems = cartService.getCartItems()
      setCartItems(updatedItems)
      setItemCount(cartService.getCartItemCount())
      setTotal(cartService.calculateCartTotal())
    }
    return removed
  }, [])

  const clearCart = useCallback(() => {
    cartService.clearCart()
    setCartItems([])
    setItemCount(0)
    setTotal(0)
  }, [])

  const isProductInCart = useCallback((productId: string) => {
    return cartService.isProductInCart(productId)
  }, [])

  return {
    cartItems,
    itemCount,
    total,
    addToCart,
    updateItem,
    removeItem,
    clearCart,
    isProductInCart
  }
}

// Quotations hook
export function useQuotations(filters: any = {}) {
  const [quotations, setQuotations] = useState<RentalQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await orderApi.getQuotations(filters)
      if (response.success && response.data) {
        setQuotations(response.data.items || [])
      } else {
        setError('Failed to fetch quotations')
        setQuotations([])
      }
    } catch (err) {
      setError('Failed to fetch quotations')
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const createQuotation = useCallback(async (quoteData: any) => {
    try {
      const response = await orderApi.createQuotation(quoteData)
      if (response.success && response.data) {
        await fetchQuotations() // Refresh quotations list
        return { success: true, data: response.data }
      } else {
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to create quotation' 
      }
    }
  }, [fetchQuotations])

  const convertToOrder = useCallback(async (id: string) => {
    try {
      const response = await orderApi.convertQuoteToOrder(id)
      if (response.success && response.data) {
        await fetchQuotations() // Refresh quotations list
        return { success: true, data: response.data }
      } else {
        return { 
          success: false, 
          error: handleApiError(response.error) 
        }
      }
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to convert quotation to order' 
      }
    }
  }, [fetchQuotations])

  return {
    quotations,
    loading,
    error,
    fetchQuotations,
    createQuotation,
    convertToOrder
  }
}

// User statistics hook
export function useUserStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await authApi.getUserStats()
        if (response.success && response.data) {
          setStats(response.data)
        } else {
          setError(handleApiError(response.error))
          setStats(null)
        }
      } catch (err) {
        setError('Failed to fetch user statistics')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

// Delivery Management Hook
export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveries = useCallback(async (filters?: any) => {
    setLoading(true)
    setError(null)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.getDeliveries(filters)
      
      if (response.success && response.data) {
        setDeliveries(response.data.data.items || [])
      } else {
        setError(handleApiError(response.error))
      }
    } catch (error: any) {
      setError(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  const createDelivery = useCallback(async (deliveryData: any) => {
    setLoading(true)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.createDelivery(deliveryData)
      
      if (response.success && response.data) {
        setDeliveries(prev => [response.data, ...prev])
        return { success: true, data: response.data }
      } else {
        return { success: false, error: handleApiError(response.error) }
      }
    } catch (error: any) {
      return { success: false, error: handleApiError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDeliveryStatus = useCallback(async (id: string, status: string, proof?: string) => {
    setLoading(true)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.updateDeliveryStatus(id, status, proof)
      
      if (response.success && response.data) {
        setDeliveries(prev => prev.map(delivery => 
          delivery.id === id ? { ...delivery, ...response.data } : delivery
        ))
        return { success: true, data: response.data }
      } else {
        return { success: false, error: handleApiError(response.error) }
      }
    } catch (error: any) {
      return { success: false, error: handleApiError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoutes = useCallback(async (date?: string) => {
    setLoading(true)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.getDeliveryRoutes(date)
      
      if (response.success && response.data) {
        setRoutes(response.data)
      } else {
        setError(handleApiError(response.error))
      }
    } catch (error: any) {
      setError(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  const autoScheduleDeliveries = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.autoScheduleDeliveries(date)
      
      if (response.success) {
        // Refresh deliveries after auto-scheduling
        await fetchDeliveries()
        return { success: true, data: response.data }
      } else {
        return { success: false, error: handleApiError(response.error) }
      }
    } catch (error: any) {
      return { success: false, error: handleApiError(error) }
    } finally {
      setLoading(false)
    }
  }, [fetchDeliveries])

  const triggerWorkflow = useCallback(async (orderId: string) => {
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.triggerDeliveryWorkflow(orderId)
      
      if (response.success) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: handleApiError(response.error) }
      }
    } catch (error: any) {
      return { success: false, error: handleApiError(error) }
    }
  }, [])

  const fetchAnalytics = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true)
    try {
      const { deliveryApi } = await import('@/lib/delivery-api')
      const response = await deliveryApi.getDeliveryAnalytics(dateFrom, dateTo)
      
      if (response.success && response.data) {
        setAnalytics(response.data)
      } else {
        setError(handleApiError(response.error))
      }
    } catch (error: any) {
      setError(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    deliveries,
    routes,
    analytics,
    loading,
    error,
    fetchDeliveries,
    createDelivery,
    updateDeliveryStatus,
    fetchRoutes,
    autoScheduleDeliveries,
    triggerWorkflow,
    fetchAnalytics
  }
}

// Analytics and Reports hook
export function useAnalytics() {
  const [revenueData, setRevenueData] = useState<any>(null)
  const [productAnalytics, setProductAnalytics] = useState<any[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<any[]>([])
  const [financialMetrics, setFinancialMetrics] = useState<any>(null)
  const [inventoryAnalytics, setInventoryAnalytics] = useState<any>(null)
  const [deliveryAnalytics, setDeliveryAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRevenueAnalytics = useCallback(async (period = '6months') => {
    setLoading(true)
    try {
      const { getRevenueAnalytics } = await import('@/lib/analytics-api')
      const data = await getRevenueAnalytics(period)
      setRevenueData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch revenue analytics')
      console.error('Revenue analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProductAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const { getProductAnalytics } = await import('@/lib/analytics-api')
      const data = await getProductAnalytics()
      setProductAnalytics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product analytics')
      console.error('Product analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCustomerAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const { getCustomerAnalytics } = await import('@/lib/analytics-api')
      const data = await getCustomerAnalytics()
      setCustomerAnalytics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer analytics')
      console.error('Customer analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFinancialMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const { getFinancialMetrics } = await import('@/lib/analytics-api')
      const data = await getFinancialMetrics()
      setFinancialMetrics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial metrics')
      console.error('Financial metrics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInventoryAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInventoryAnalytics()
      setInventoryAnalytics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory analytics')
      console.error('Inventory analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDeliveryAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDeliveryAnalytics()
      setDeliveryAnalytics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch delivery analytics')
      console.error('Delivery analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const exportReport = useCallback(async (format: 'pdf' | 'excel' = 'pdf', period = '1month') => {
    try {
      const { exportBusinessReport } = await import('@/lib/analytics-api')
      const result = await exportBusinessReport(format, period)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to export report')
      throw err
    }
  }, [])

  return {
    revenueData,
    productAnalytics,
    customerAnalytics,
    financialMetrics,
    inventoryAnalytics,
    deliveryAnalytics,
    loading,
    error,
    fetchRevenueAnalytics,
    fetchProductAnalytics,
    fetchCustomerAnalytics,
    fetchFinancialMetrics,
    fetchInventoryAnalytics,
    fetchDeliveryAnalytics,
    exportReport
  }
}
