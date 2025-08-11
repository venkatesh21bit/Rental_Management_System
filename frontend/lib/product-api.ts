// Product API Service
import { apiService, ApiResponse, PaginatedResponse, buildQueryString } from '@/lib/api'

// Product types
export interface Product {
  id: string
  name: string
  description: string
  category: string
  brand?: string
  color?: string
  condition?: string
  image?: string
  isRentable: boolean
  basePrice: number
  unit: 'hour' | 'day' | 'week' | 'month'
  specifications?: Record<string, string>
  rating?: number
  reviews?: number
  features?: string[]
  location?: string
  weight?: string
  dimensions?: string
  pricing: {
    hourly?: number
    daily?: number
    weekly?: number
    monthly?: number
  }
  deposit?: number
  availability: 'available' | 'limited' | 'unavailable'
  totalStock?: number
  availableStock?: number
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  isActive: boolean
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText?: string
  isPrimary: boolean
  order: number
}

export interface ProductItem {
  id: string
  productId: string
  serialNumber?: string
  status: 'available' | 'rented' | 'maintenance' | 'damaged'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
  location?: string
}

export interface ProductAvailability {
  isAvailable: boolean
  nextAvailableDate?: string
  unavailableDates: string[]
  availableQuantity: number
}

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  isRentable?: boolean
  availability?: boolean
  sortBy?: 'name' | 'price' | 'category' | 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  brands?: string[]
  colors?: string[]
  conditions?: string[]
}

export interface AvailabilityCheckRequest {
  startDate: string
  endDate: string
  quantity?: number
}

// Product API Service
export class ProductApiService {

  // Get all products with filtering and pagination
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/catalog/products/${queryString}`) as Promise<PaginatedResponse<Product>>
  }

  // Get single product details
  async getProduct(id: string): Promise<ApiResponse<{
    product: Product
    availability: ProductAvailability
  }>> {
    return apiService.get(`/catalog/products/${id}/`)
  }

  // Check product availability
  async checkAvailability(id: string, params: AvailabilityCheckRequest): Promise<ApiResponse<ProductAvailability>> {
    const queryString = buildQueryString(params)
    return apiService.get(`/catalog/products/${id}/availability/${queryString}`)
  }

  // Get all product categories
  async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return apiService.get('/catalog/categories/')
  }

  // Get category tree
  async getCategoryTree(): Promise<ApiResponse<ProductCategory[]>> {
    return apiService.get('/catalog/categories/tree/')
  }

  // Get products in category
  async getProductsByCategory(categoryId: string, filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/catalog/categories/${categoryId}/products/${queryString}`) as Promise<PaginatedResponse<Product>>
  }

  // Get product images
  async getProductImages(productId: string): Promise<ApiResponse<ProductImage[]>> {
    return apiService.get(`/catalog/product-images/?product=${productId}`)
  }

  // Get product items (individual units)
  async getProductItems(productId?: string, filters: { 
    status?: string
    available?: boolean
    page?: number
    limit?: number 
  } = {}): Promise<PaginatedResponse<ProductItem>> {
    const params = { ...filters, ...(productId && { product: productId }) }
    const queryString = buildQueryString(params)
    return apiService.get(`/catalog/product-items/${queryString}`) as Promise<PaginatedResponse<ProductItem>>
  }

  // Get available product items
  async getAvailableItems(filters: {
    productId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  } = {}): Promise<PaginatedResponse<ProductItem>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/catalog/product-items/available/${queryString}`) as Promise<PaginatedResponse<ProductItem>>
  }

  // Search products (enhanced search with filters)
  async searchProducts(query: string, filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ ...filters, search: query })
  }

  // Get popular products
  async getPopularProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    return apiService.get(`/dashboard/products/popular/?limit=${limit}`)
  }

  // Get featured products (can be implemented based on business logic)
  async getFeaturedProducts(limit = 6): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ limit, sortBy: 'rating', sortOrder: 'desc' })
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items
      }
    }
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch featured products' }
    }
  }

  // Get recently added products
  async getRecentProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ limit, sortBy: 'createdAt', sortOrder: 'desc' })
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items
      }
    }
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch recent products' }
    }
  }

  // Get products by multiple IDs
  async getProductsByIds(ids: string[]): Promise<ApiResponse<Product[]>> {
    const queryString = buildQueryString({ ids })
    return apiService.get(`/catalog/products/by-ids/${queryString}`)
  }
}

// Create and export singleton instance
export const productApi = new ProductApiService()

// Export default
export default productApi
