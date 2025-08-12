import { ApiResponse, AuthResponse, LoginCredentials, RegisterData, User } from '../types';
import { apiService } from './apiService';

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiService.post('/auth/login/', credentials);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiService.post('/auth/register/', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Logout user
  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/auth/logout/');
      return response.data;
    } catch (error: any) {
      // Don't throw error on logout - just log it
      console.error('Logout error:', error);
      return { success: true };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access: string }>> {
    try {
      const response = await apiService.post('/auth/refresh/', {
        refresh: refreshToken,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get('/accounts/profile/me/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put('/accounts/profile/update_profile/', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Change password
  async changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/accounts/profile/change_password/', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/auth/forgot-password/', { email });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(data: {
    token: string;
    uid: string;
    new_password: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/auth/reset-password/', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get user statistics
  async getUserStats(): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/accounts/profile/stats/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get user order history
  async getUserOrders(params?: any): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/accounts/profile/orders/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Verify email (if implemented)
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/auth/verify-email/', { token });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/auth/resend-verification/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  private handleError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      if (apiError.message) {
        return new Error(apiError.message);
      }
      if (apiError.errors) {
        const errorMessages = Object.values(apiError.errors).flat();
        return new Error(errorMessages.join(', '));
      }
      if (typeof apiError === 'string') {
        return new Error(apiError);
      }
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An unexpected error occurred');
  }
}

export const authService = new AuthService();
export default authService;
