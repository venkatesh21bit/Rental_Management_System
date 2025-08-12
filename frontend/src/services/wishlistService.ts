import { ApiResponse, PaginatedResponse, Product } from '../types';
import { apiService } from './apiService';

export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

class WishlistService {
  // Get user's wishlist items
  async getWishlistItems(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<WishlistItem>>> {
    try {
      const response = await apiService.get('/wishlist/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Add product to wishlist
  async addToWishlist(productId: number): Promise<ApiResponse<WishlistItem>> {
    try {
      const response = await apiService.post('/wishlist/', {
        product_id: productId
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(productId: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/wishlist/${productId}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Check if product is in wishlist
  async isInWishlist(productId: number): Promise<ApiResponse<{ is_wishlisted: boolean }>> {
    try {
      const response = await apiService.get(`/wishlist/check/${productId}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Clear entire wishlist
  async clearWishlist(): Promise<ApiResponse> {
    try {
      const response = await apiService.delete('/wishlist/clear/');
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

export const wishlistService = new WishlistService();
