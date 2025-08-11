// Catalog API Service - Real Backend Integration
import { apiService, ApiResponse, PaginatedResponse, buildQueryString } from '@/lib/api'

// Updated Product types to match backend API
export interface Product {
  id: number
  name: string
  description: string
  detailed_description?: string
  category: {
    id: number
    name: string
    slug: string
  }
  daily_rate: number
  weekly_rate: number
  monthly_rate: number
  security_deposit: number
  images: ProductImage[]
  specifications: Record<string, any>
  availability_status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED'
  average_rating: number
  total_reviews: number
  available_quantity: number
  created_at: string
  included_accessories?: string[]
  optional_accessories?: Accessory[]
  available_items?: ProductItem[]
  reviews?: Review[]
  rental_terms?: RentalTerms
}

export interface ProductImage {
  id: number
  image: string
  alt_text?: string
  is_primary: boolean
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
  description?: string
  parent?: number
  is_active: boolean
  product_count?: number
}

export interface Accessory {
  id: number
  name: string
  daily_rate: number
}

export interface ProductItem {
  id: number
  serial_number: string
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  last_maintenance: string
  availability_status: string
}

export interface Review {
  id: number
  customer_name: string
  rating: number
  comment: string
  created_at: string
}

export interface RentalTerms {
  minimum_rental_days: number
  maximum_rental_days: number
  delivery_available: boolean
  pickup_required: boolean
}

export interface ProductFilters {
  category?: number
  search?: string
  min_price?: number
  max_price?: number
  available_from?: string
  available_to?: string
  page?: number
  limit?: number
  ordering?: string
}

export interface AvailabilityCheckRequest {
  start_date: string
  end_date: string
  quantity?: number
}

export interface ProductAvailability {
  is_available: boolean
  available_quantity: number
  conflicts: Array<{
    start_date: string
    end_date: string
    quantity: number
  }>
}

class CatalogApiService {
  // Get all products with filters
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/catalog/products/${queryString}`) as Promise<PaginatedResponse<Product>>
  }

  // Get single product by ID
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiService.get(`/catalog/products/${id}/`)
  }

  // Check product availability
  async checkAvailability(id: number, params: AvailabilityCheckRequest): Promise<ApiResponse<ProductAvailability>> {
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
  async getProductsByCategory(categoryId: number, filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const queryString = buildQueryString(filters)
    return apiService.get(`/catalog/categories/${categoryId}/products/${queryString}`) as Promise<PaginatedResponse<Product>>
  }

  // Search products (enhanced search with filters)
  async searchProducts(query: string, filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ ...filters, search: query })
  }

  // Get popular products
  async getPopularProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    return apiService.get(`/dashboard/products/popular/?limit=${limit}`)
  }

  // Get featured products
  async getFeaturedProducts(limit = 6): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ limit, ordering: '-average_rating' })
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items || response.data.products || []
      }
    }
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch featured products' }
    }
  }

  // Get recently added products
  async getRecentProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ limit, ordering: '-created_at' })
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.items || response.data.products || []
      }
    }
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch recent products' }
    }
  }
}

export const catalogApi = new CatalogApiService()
export default catalogApi
