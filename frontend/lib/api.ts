// API Configuration and Base Service
import { cookies } from 'next/headers'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rentalmanagementsystem-production.up.railway.app/api'

// Types for common API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items?: T[]
    products?: T[]  // Backend returns products array
    total?: number
    page?: number
    totalPages?: number
    hasNext?: boolean
    hasPrev?: boolean
    pagination?: {   // Backend returns nested pagination object
      total: number
      page: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
}

// Request configuration interface
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  token?: string
}

// Base API Service Class
export class ApiService {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  // Get auth token from localStorage or cookies
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  // Make HTTP request with proper error handling
  async request<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const token = config.token || this.getAuthToken()
    
    console.log('API Request:', { url, method: config.method, hasToken: !!token })
    
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      ...(config.body && { body: JSON.stringify(config.body) }),
    }

    try {
      const response = await fetch(url, requestConfig)
      console.log('API Response status:', response.status, response.statusText)
      
      let data
      try {
        data = await response.json()
        console.log('API Response data:', data)
      } catch (jsonError) {
        // Handle non-JSON responses (like HTML error pages)
        const textResponse = await response.text()
        console.error('Failed to parse JSON response:', textResponse.substring(0, 200))
        
        if (!response.ok) {
          return {
            success: false,
            error: {
              code: response.status.toString(),
              message: `Server returned ${response.status}: ${response.statusText}`,
              details: textResponse.substring(0, 500)
            }
          }
        }
        
        // If it's a successful response but not JSON, treat it as an error
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE_FORMAT',
            message: 'Server returned non-JSON response',
            details: textResponse.substring(0, 500)
          }
        }
      }

      if (!response.ok) {
        // Handle 401 unauthorized - redirect to home page
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/'
          }
        }
        
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || response.statusText,
            details: data.error || data
          }
        }
      }

      // Backend returns {success: true, data: {...}} format
      if (data.success && data.data) {
        return {
          success: true,
          data: data.data
        }
      } else {
        return {
          success: true,
          data
        }
      }
    } catch (error) {
      console.error('API Request failed:', error)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error
        }
      }
    }
  }

  // HTTP method helpers
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', token })
  }

  async post<T>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, token })
  }

  async put<T>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, token })
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', token })
  }

  async patch<T>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, token })
  }
}

// Create a singleton instance
export const apiService = new ApiService()

// Helper function to build query strings
export function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params).filter(([_, value]) => 
    value !== undefined && value !== null && value !== ''
  )
  
  if (filtered.length === 0) return ''
  
  const searchParams = new URLSearchParams()
  filtered.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v.toString()))
    } else {
      searchParams.append(key, value.toString())
    }
  })
  
  return `?${searchParams.toString()}`
}

// Helper function to handle API errors
export function handleApiError(error: ApiResponse<any>['error'], defaultMessage = 'An error occurred') {
  if (!error) return defaultMessage
  
  switch (error.code) {
    case '401':
      // Handle unauthorized - redirect to home page (which shows login)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/'
      }
      return 'Please log in to continue'
    case '403':
      return 'You don\'t have permission to perform this action'
    case '404':
      return 'The requested resource was not found'
    case '422':
      return error.details?.message || 'Invalid data provided'
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.'
    default:
      return error.message || defaultMessage
  }
}

export default apiService
