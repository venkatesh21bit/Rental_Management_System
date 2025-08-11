// API Service with comprehensive type definitions and axios integration
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data.data;
          localStorage.setItem('access_token', access);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response Type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// Base Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
}

export interface Address {
  id?: number;
  type: 'BILLING' | 'SHIPPING' | 'DELIVERY';
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: number;
  children?: Category[];
  product_count: number;
  featured?: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: Category;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  security_deposit: number;
  images: ProductImage[];
  specifications: Record<string, any>;
  availability_status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
  average_rating: number;
  total_reviews: number;
  available_quantity: number;
  created_at: string;
}

export interface ProductDetail extends Product {
  detailed_description: string;
  included_accessories: string[];
  optional_accessories: Accessory[];
  available_items: ProductItem[];
  reviews: Review[];
  rental_terms: RentalTerms;
}

export interface Accessory {
  id?: number;
  name: string;
  daily_rate: number;
}

export interface ProductItem {
  id: number;
  serial_number: string;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  last_maintenance: string;
  availability_status: string;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface RentalTerms {
  minimum_rental_days: number;
  maximum_rental_days: number;
  delivery_available: boolean;
  pickup_required: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  customer: User;
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  created_at: string;
  delivery_date?: string;
  return_due_date?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  status: string;
  customer: User;
  items: QuoteItemDetail[];
  pricing: QuotePricing;
  delivery_address?: Address;
  valid_until: string;
  created_at: string;
}

export interface QuoteItemDetail {
  id: number;
  product: Product;
  quantity: number;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  accessories: AccessoryDetail[];
}

export interface AccessoryDetail {
  name: string;
  quantity: number;
  daily_rate: number;
  total_amount: number;
}

export interface QuotePricing {
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  security_deposit: number;
  total_amount: number;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  processed_at: string;
  description: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  customer: User;
  order_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: Record<string, any>;
}

// Request/Response Types
export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company_name?: string;
  user_type: 'INDIVIDUAL' | 'BUSINESS';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface UserProfile extends User {
  phone_number?: string;
  company_name?: string;
  user_type: string;
  customer_group?: {
    id: number;
    name: string;
    discount_percentage: number;
  };
  addresses: Address[];
  created_at: string;
}

export interface UserStats {
  total_orders: number;
  total_spent: number;
  active_rentals: number;
  overdue_returns: number;
  total_saved: number;
  loyalty_points: number;
  membership_since: string;
  preferred_categories: string[];
}

export interface CreateQuoteData {
  items: QuoteItem[];
  delivery_address?: Address;
  special_instructions?: string;
  delivery_required?: boolean;
}

export interface QuoteItem {
  product_id: number;
  quantity: number;
  start_date: string;
  end_date: string;
  accessories?: AccessoryItem[];
}

export interface AccessoryItem {
  accessory_id: number;
  quantity: number;
}

// API Methods
class ApiService {
  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api(config);
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data.data as T;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  }

  // Authentication APIs
  auth = {
    register: (data: RegisterData) =>
      this.request<AuthResponse>({
        method: 'POST',
        url: '/auth/register/',
        data,
      }),

    login: (data: LoginData) =>
      this.request<AuthResponse>({
        method: 'POST',
        url: '/auth/login/',
        data,
      }),

    refresh: (refresh_token: string) =>
      this.request<{ access: string }>({
        method: 'POST',
        url: '/auth/refresh/',
        data: { refresh: refresh_token },
      }),

    forgotPassword: (email: string) =>
      this.request<{ message: string }>({
        method: 'POST',
        url: '/auth/forgot-password/',
        data: { email },
      }),

    resetPassword: (data: { token: string; uid: string; new_password: string }) =>
      this.request<{ message: string }>({
        method: 'POST',
        url: '/auth/reset-password/',
        data,
      }),
  };

  // User Profile APIs
  profile = {
    getMe: () =>
      this.request<UserProfile>({
        method: 'GET',
        url: '/profile/me/',
      }),

    updateMe: (data: Partial<UserProfile>) =>
      this.request<UserProfile>({
        method: 'PATCH',
        url: '/profile/me/',
        data,
      }),

    changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
      this.request<{ message: string }>({
        method: 'POST',
        url: '/profile/change_password/',
        data,
      }),

    getStats: () =>
      this.request<UserStats>({
        method: 'GET',
        url: '/profile/stats/',
      }),
  };

  // Product Catalog APIs
  catalog = {
    getProducts: (params?: Record<string, any>) =>
      this.request<PaginatedResponse<Product>>({
        method: 'GET',
        url: '/catalog/products/',
        params,
      }),

    getProduct: (id: number) =>
      this.request<ProductDetail>({
        method: 'GET',
        url: `/catalog/products/${id}/`,
      }),

    checkAvailability: (id: number, params: { start_date: string; end_date: string; quantity: number }) =>
      this.request<any>({
        method: 'GET',
        url: `/catalog/products/${id}/availability/`,
        params,
      }),

    getCategories: () =>
      this.request<Category[]>({
        method: 'GET',
        url: '/catalog/categories/',
      }),
  };

  // Order Management APIs
  orders = {
    createQuote: (data: CreateQuoteData) =>
      this.request<Quote>({
        method: 'POST',
        url: '/orders/quotes/',
        data,
      }),

    convertQuoteToOrder: (quoteId: string, data: any) =>
      this.request<any>({
        method: 'POST',
        url: `/orders/quotes/${quoteId}/convert_to_order/`,
        data,
      }),

    getOrders: (params?: Record<string, any>) =>
      this.request<PaginatedResponse<Order>>({
        method: 'GET',
        url: '/orders/orders/',
        params,
      }),

    getOrder: (id: string) =>
      this.request<Order>({
        method: 'GET',
        url: `/orders/orders/${id}/`,
      }),
  };

  // Payment APIs
  payments = {
    createIntent: (data: any) =>
      this.request<any>({
        method: 'POST',
        url: '/payments/create_intent/',
        data,
      }),

    confirmPayment: (data: any) =>
      this.request<any>({
        method: 'POST',
        url: '/payments/confirm/',
        data,
      }),

    getPayments: (params?: Record<string, any>) =>
      this.request<PaginatedResponse<Payment>>({
        method: 'GET',
        url: '/payments/',
        params,
      }),
  };

  // Invoice APIs
  invoices = {
    getInvoices: (params?: Record<string, any>) =>
      this.request<PaginatedResponse<Invoice>>({
        method: 'GET',
        url: '/invoicing/invoices/',
        params,
      }),

    getInvoice: (id: string) =>
      this.request<Invoice>({
        method: 'GET',
        url: `/invoicing/invoices/${id}/`,
      }),

    downloadPDF: (id: string) =>
      api.get(`/invoicing/invoices/${id}/pdf/`, {
        responseType: 'blob',
      }),
  };

  // Notification APIs
  notifications = {
    getNotifications: (params?: Record<string, any>) =>
      this.request<PaginatedResponse<Notification>>({
        method: 'GET',
        url: '/notifications/',
        params,
      }),

    markAsRead: (id: number) =>
      this.request<{ message: string }>({
        method: 'PUT',
        url: `/notifications/${id}/read/`,
      }),

    markAllAsRead: () =>
      this.request<{ marked_read_count: number }>({
        method: 'PUT',
        url: '/notifications/read-all/',
      }),
  };

  // System Health APIs
  health = {
    check: () =>
      this.request<any>({
        method: 'GET',
        url: '/health/',
      }),

    getMetrics: () =>
      this.request<any>({
        method: 'GET',
        url: '/metrics/',
      }),
  };
}

// Export API service instance
export const apiService = new ApiService();
export default api;
