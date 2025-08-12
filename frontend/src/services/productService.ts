import { 
  ApiResponse, 
  Product, 
  ProductCategory, 
  ProductFormData,
  ProductFilters,
  PaginatedResponse,
  AvailabilityCheck,
  AvailabilityResult 
} from '../types';
import { apiService } from './apiService';

class ProductService {
  // Get all products with filtering and pagination
  async getProducts(options?: ProductFilters & { page?: number; page_size?: number; ordering?: string; availability?: string }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      const response = await apiService.get('/catalog/products/', { params: options });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get single product by ID
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    try {
      const response = await apiService.get(`/catalog/products/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create new product (business users only)
  async createProduct(productData: ProductFormData): Promise<ApiResponse<Product>> {
    try {
      const response = await apiService.post('/catalog/products/', productData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update existing product
  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<ApiResponse<Product>> {
    try {
      const response = await apiService.put(`/catalog/products/${id}/`, productData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete product
  async deleteProduct(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/catalog/products/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Check product availability
  async checkAvailability(productId: number, startDate: string, endDate: string, quantity = 1): Promise<ApiResponse<AvailabilityResult>> {
    try {
      const response = await apiService.get(`/catalog/products/${productId}/availability/`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          quantity,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Bulk availability check
  async batchCheckAvailability(checks: AvailabilityCheck[]): Promise<ApiResponse<AvailabilityResult[]>> {
    try {
      const response = await apiService.post('/orders/availability/batch_check/', {
        checks,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get availability calendar for a product
  async getAvailabilityCalendar(productId: number, month: string): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/orders/availability/calendar/', {
        params: {
          product_id: productId,
          month,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Upload product images
  async uploadProductImages(productId: number, files: File[]): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
      formData.append('product', productId.toString());

      const response = await apiService.post('/catalog/product-images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete product image
  async deleteProductImage(imageId: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/catalog/product-images/${imageId}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Bulk update products
  async bulkUpdateProducts(updates: Array<{ id: number; data: Partial<ProductFormData> }>): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/catalog/products/bulk_update/', {
        updates,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Search products
  async searchProducts(query: string, filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    try {
      const params = {
        search: query,
        ...filters,
      };
      
      const response = await apiService.get('/catalog/products/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get product categories
  async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const response = await apiService.get('/catalog/categories/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get category tree
  async getCategoryTree(): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const response = await apiService.get('/catalog/categories/tree/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create new category
  async createCategory(categoryData: {
    name: string;
    description?: string;
    parent?: number;
    image?: File;
  }): Promise<ApiResponse<ProductCategory>> {
    try {
      const formData = new FormData();
      formData.append('name', categoryData.name);
      if (categoryData.description) {
        formData.append('description', categoryData.description);
      }
      if (categoryData.parent) {
        formData.append('parent', categoryData.parent.toString());
      }
      if (categoryData.image) {
        formData.append('image', categoryData.image);
      }

      const response = await apiService.post('/catalog/categories/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update category
  async updateCategory(id: number, categoryData: Partial<ProductCategory>): Promise<ApiResponse<ProductCategory>> {
    try {
      const response = await apiService.put(`/catalog/categories/${id}/`, categoryData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete category
  async deleteCategory(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/catalog/categories/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get products in category
  async getProductsInCategory(categoryId: number, page = 1, pageSize = 12): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      const response = await apiService.get(`/catalog/categories/${categoryId}/products/`, {
        params: {
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get inventory status (admin/business users)
  async getInventoryStatus(): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/catalog/inventory/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update inventory status
  async updateInventoryStatus(updates: Array<{
    product_item_id: number;
    status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'DAMAGED';
    notes?: string;
  }>): Promise<ApiResponse> {
    try {
      const response = await apiService.put('/catalog/inventory/update_status/', {
        updates,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/catalog/inventory/alerts/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get featured/popular products
  async getFeaturedProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    try {
      const response = await apiService.get('/catalog/products/', {
        params: {
          is_featured: true,
          limit,
        },
      });
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

export const productService = new ProductService();
export default productService;
