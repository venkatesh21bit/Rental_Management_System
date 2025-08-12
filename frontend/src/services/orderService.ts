import { 
  ApiResponse, 
  RentalOrder, 
  RentalQuote, 
  OrderFormData,
  OrderFilters,
  PaginatedResponse 
} from '../types';
import { apiService } from './apiService';

class OrderService {
  // RENTAL QUOTES

  // Get rental quotes
  async getQuotes(filters?: OrderFilters, page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<RentalQuote>>> {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      
      const response = await apiService.get('/orders/quotes/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get single quote
  async getQuote(id: number): Promise<ApiResponse<RentalQuote>> {
    try {
      const response = await apiService.get(`/orders/quotes/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create rental quote
  async createQuote(quoteData: {
    customer?: number;
    items: Array<{
      product: number;
      quantity: number;
    }>;
    start_date: string;
    end_date: string;
    notes?: string;
  }): Promise<ApiResponse<RentalQuote>> {
    try {
      const response = await apiService.post('/orders/quotes/', quoteData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update quote
  async updateQuote(id: number, quoteData: Partial<RentalQuote>): Promise<ApiResponse<RentalQuote>> {
    try {
      const response = await apiService.put(`/orders/quotes/${id}/`, quoteData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete quote
  async deleteQuote(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/orders/quotes/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Convert quote to order
  async convertQuoteToOrder(quoteId: number): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/quotes/${quoteId}/convert_to_order/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Send quote via email
  async sendQuote(quoteId: number, email?: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post(`/orders/quotes/${quoteId}/send_quote/`, {
        email,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Calculate pricing for quote
  async calculatePricing(items: Array<{
    product: number;
    quantity: number;
  }>, startDate: string, endDate: string, customerId?: number): Promise<ApiResponse> {
    try {
      const response = await apiService.get('/orders/quotes/calculate_pricing/', {
        params: {
          items: JSON.stringify(items),
          start_date: startDate,
          end_date: endDate,
          customer_id: customerId,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // RENTAL ORDERS

  // Get rental orders
  async getOrders(filters?: OrderFilters, page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<RentalOrder>>> {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      
      const response = await apiService.get('/orders/orders/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get single order
  async getOrder(id: number): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.get(`/orders/orders/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create rental order
  async createOrder(orderData: OrderFormData): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post('/orders/orders/', orderData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update order
  async updateOrder(id: number, orderData: Partial<RentalOrder>): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.put(`/orders/orders/${id}/`, orderData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Confirm pickup
  async confirmPickup(orderId: number, notes?: string): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/orders/${orderId}/confirm_pickup/`, {
        notes,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Confirm return
  async confirmReturn(orderId: number, data: {
    condition_notes?: string;
    damage_assessment?: string;
    late_fee_applicable?: boolean;
    return_notes?: string;
  }): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/orders/${orderId}/confirm_return/`, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Check order availability
  async checkOrderAvailability(orderId: number): Promise<ApiResponse> {
    try {
      const response = await apiService.get(`/orders/orders/${orderId}/check_availability/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get overdue orders
  async getOverdueOrders(): Promise<ApiResponse<RentalOrder[]>> {
    try {
      const response = await apiService.get('/orders/orders/overdue_orders/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Cancel order
  async cancelOrder(orderId: number, reason?: string): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/orders/${orderId}/cancel/`, {
        reason,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Extend rental period
  async extendRental(orderId: number, newEndDate: string): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/orders/${orderId}/extend/`, {
        new_end_date: newEndDate,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get order history for customer
  async getCustomerOrderHistory(customerId?: number, page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<RentalOrder>>> {
    try {
      const params: { page: number; page_size: number; customer?: number } = {
        page,
        page_size: pageSize,
      };
      
      if (customerId) {
        params.customer = customerId;
      }

      const response = await apiService.get('/accounts/profile/orders/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get order statistics
  async getOrderStats(period?: string): Promise<ApiResponse> {
    try {
      const params = period ? { period } : {};
      const response = await apiService.get('/orders/orders/stats/', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // AVAILABILITY MANAGEMENT

  // Check general availability
  async checkAvailability(data: {
    product_id: number;
    start_date: string;
    end_date: string;
    quantity: number;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/orders/availability/check/', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Find alternative dates
  async findAlternativeDates(data: {
    product_id: number;
    start_date: string;
    end_date: string;
    quantity: number;
    flexibility_days?: number;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post('/orders/availability/alternatives/', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ORDER TRACKING

  // Get order tracking information
  async getOrderTracking(orderId: number): Promise<ApiResponse> {
    try {
      const response = await apiService.get(`/orders/orders/${orderId}/tracking/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update order status
  async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<ApiResponse<RentalOrder>> {
    try {
      const response = await apiService.post(`/orders/orders/${orderId}/update_status/`, {
        status,
        notes,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // CART FUNCTIONALITY (for frontend state management)
  
  // These methods help manage cart state on frontend
  getCart(): any[] {
    if (typeof window === 'undefined') return [];
    const cart = localStorage.getItem('rental_cart');
    return cart ? JSON.parse(cart) : [];
  }

  addToCart(item: {
    product: any;
    quantity: number;
    start_date: string;
    end_date: string;
  }): void {
    if (typeof window === 'undefined') return;
    const cart = this.getCart();
    const existingItem = cart.find(cartItem => cartItem.product.id === item.product.id);
    
    if (existingItem) {
      existingItem.quantity = item.quantity;
      existingItem.start_date = item.start_date;
      existingItem.end_date = item.end_date;
    } else {
      cart.push(item);
    }
    
    localStorage.setItem('rental_cart', JSON.stringify(cart));
  }

  removeFromCart(productId: number): void {
    if (typeof window === 'undefined') return;
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.product.id !== productId);
    localStorage.setItem('rental_cart', JSON.stringify(updatedCart));
  }

  clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('rental_cart');
  }

  updateCartItem(productId: number, updates: any): void {
    if (typeof window === 'undefined') return;
    const cart = this.getCart();
    const item = cart.find(cartItem => cartItem.product.id === productId);
    
    if (item) {
      Object.assign(item, updates);
      localStorage.setItem('rental_cart', JSON.stringify(cart));
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

export const orderService = new OrderService();
export default orderService;
