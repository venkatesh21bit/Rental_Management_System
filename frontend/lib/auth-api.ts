// Authentication API Service
import { apiService, ApiResponse } from '@/lib/api'

// User types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  customerType: 'individual' | 'corporate'
  pricelistId?: string
  totalRentals: number
  totalSpent: number
}

export interface AuthTokens {
  token: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  customerType: 'individual' | 'corporate'
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken?: string
  refresh_token?: string  // Backend sends this format
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// Auth API Service
export class AuthApiService {
  
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/auth/login/', credentials)
    
    if (response.success && response.data) {
      // Store tokens in localStorage - handle both refreshToken and refresh_token
      const refreshToken = response.data.refreshToken || response.data.refresh_token
      localStorage.setItem('authToken', response.data.token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/auth/register/', userData)
    
    if (response.success && response.data) {
      // Store tokens in localStorage - handle both refreshToken and refresh_token
      const refreshToken = response.data.refreshToken || response.data.refresh_token
      localStorage.setItem('authToken', response.data.token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // Logout user
  async logout(): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/logout/')
    
    // Clear stored data regardless of response
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    return response
  }

  // Refresh access token
  async refreshToken(refreshToken?: string): Promise<ApiResponse<AuthTokens>> {
    const token = refreshToken || localStorage.getItem('refreshToken')
    
    if (!token) {
      return {
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available'
        }
      }
    }

    const response = await apiService.post<AuthTokens>('/auth/refresh/', { refreshToken: token })
    
    if (response.success && response.data) {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
    } else {
      // Clear tokens if refresh failed
      this.logout()
    }
    
    return response
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/auth/forgot-password/', data)
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/auth/reset-password/', data)
  }

  // Change password (authenticated user)
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/accounts/profile/change_password/', data)
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    
    return !!(token && user)
  }

  // Get current auth token
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiService.put<User>('/accounts/profile/update_profile/', userData)
  }

  // Get user profile data
  async getProfile(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/accounts/profile/me/')
  }

  // Get user statistics
  async getUserStats(): Promise<ApiResponse<{
    totalRentals: number
    totalSpent: number
    activeRentals: number
    upcomingRentals: number
  }>> {
    return apiService.get('/accounts/profile/stats/')
  }

  // Get user order history
  async getUserOrders(page = 1, limit = 20): Promise<ApiResponse<{
    orders: any[]
    total: number
    page: number
    totalPages: number
  }>> {
    return apiService.get(`/accounts/profile/orders/?page=${page}&limit=${limit}`)
  }
}

// Create and export singleton instance
export const authApi = new AuthApiService()

// Export default
export default authApi
