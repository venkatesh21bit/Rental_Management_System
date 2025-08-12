import { ApiResponse, User } from '../types';
import { apiService } from './apiService';

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

class UserService {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get('/accounts/profile/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userData: UpdateProfileData): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.patch('/accounts/profile/', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Change password
  async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/accounts/change-password/', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete account
  async deleteAccount(): Promise<ApiResponse> {
    try {
      const response = await apiService.delete('/accounts/profile/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export const userService = new UserService();
