// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company_name?: string;
  user_type: 'CUSTOMER' | 'BUSINESS';
  is_active: boolean;
  is_staff: boolean;
  customer_group?: CustomerGroup;
  addresses: Address[];
  date_joined: string;
  last_login?: string;
}

export interface CustomerGroup {
  id: number;
  name: string;
  discount_percentage: number;
  description?: string;
}

export interface Address {
  id: number;
  type: 'BILLING' | 'SHIPPING';
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

// Auth Types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
  user_type?: 'CUSTOMER' | 'BUSINESS';
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company_name?: string;
  user_type: 'CUSTOMER' | 'BUSINESS';
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string;
  category: ProductCategory;
  sku: string;
  rental_rate: number;
  rental_price: number; // Alias for rental_rate
  weekly_price?: number;
  monthly_price?: number;
  rental_unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  availability_count: number;
  available_quantity: number; // Alias for availability_count
  images: ProductImage[];
  specifications: { [key: string]: string | number };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  weight?: number;
  rating?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent?: number;
  image?: string;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface ProductSpecification {
  id: number;
  name: string;
  value: string;
  unit?: string;
}

export interface ProductItem {
  id: number;
  product: number;
  serial_number: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'DAMAGED';
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
  purchase_date?: string;
  last_maintenance?: string;
  notes?: string;
}

// Order Types
export interface RentalQuote {
  id: number;
  customer: User;
  items: RentalQuoteItem[];
  start_date: string;
  end_date: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
  notes?: string;
  terms_and_conditions?: string;
}

export interface RentalQuoteItem {
  id: number;
  product: Product;
  quantity: number;
  rental_rate: number;
  duration_days: number;
  line_total: number;
  notes?: string;
}

export interface RentalOrder {
  id: number;
  customer: User;
  quote?: RentalQuote;
  items: RentalOrderItem[];
  start_date: string;
  end_date: string;
  actual_return_date?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED' | 'OVERDUE';
  pickup_address: Address;
  return_address: Address;
  total_amount: number;
  paid_amount: number;
  deposit_amount: number;
  late_fee_amount: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  special_instructions?: string;
}

export interface RentalOrderItem {
  id: number;
  product: Product;
  product_item?: ProductItem;
  quantity: number;
  rental_rate: number;
  line_total: number;
  picked_up_at?: string;
  returned_at?: string;
  condition_on_pickup?: string;
  condition_on_return?: string;
  damage_notes?: string;
}

// Payment Types
export interface Payment {
  id: number;
  order: number;
  amount: number;
  payment_method: 'STRIPE' | 'RAZORPAY' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH';
  payment_type: 'PAYMENT' | 'REFUND' | 'DEPOSIT' | 'LATE_FEE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  transaction_id?: string;
  gateway_response?: any;
  processed_at?: string;
  created_at: string;
  notes?: string;
}

export interface PaymentIntent {
  client_secret: string;
  amount: number;
  currency: string;
  payment_method_types: string[];
}

// Invoice Types
export interface Invoice {
  id: number;
  order: RentalOrder;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  pdf_file?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

// Delivery Types
export interface Delivery {
  id: number;
  order: number;
  type: 'PICKUP' | 'RETURN';
  scheduled_date: string;
  actual_date?: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  driver_name?: string;
  driver_phone?: string;
  vehicle_info?: string;
  tracking_notes: DeliveryNote[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryNote {
  id: number;
  timestamp: string;
  status: string;
  message: string;
  location?: string;
}

// Notification Types
export interface Notification {
  id: number;
  user: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Pricing Types
export interface PriceRule {
  id: number;
  name: string;
  description?: string;
  rule_type: 'DURATION' | 'QUANTITY' | 'CUSTOMER_GROUP' | 'SEASONAL';
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_duration?: number;
  max_duration?: number;
  min_quantity?: number;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
}

// Report Types
export interface ReportData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  products_rented: number;
  top_products: Array<{
    product: Product;
    rental_count: number;
    revenue: number;
  }>;
  top_customers: Array<{
    customer: User;
    order_count: number;
    total_spent: number;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    count: number;
    next?: string;
    previous?: string;
    page_size: number;
    current_page: number;
    total_pages: number;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Form Types
export interface ProductFormData {
  name: string;
  description: string;
  category: number;
  sku: string;
  rental_rate: number;
  rental_unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  availability_count: number;
  is_active: boolean;
  tags: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  specifications: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
}

export interface OrderFormData {
  customer: number;
  items: Array<{
    product: number;
    quantity: number;
  }>;
  start_date: string;
  end_date: string;
  pickup_address: Partial<Address>;
  return_address: Partial<Address>;
  notes?: string;
  special_instructions?: string;
}

// Filter Types
export interface ProductFilters {
  category?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  rental_unit?: string;
  tags?: string[];
  availability_date?: string;
  availability_end_date?: string;
}

export interface OrderFilters {
  status?: string;
  start_date?: string;
  end_date?: string;
  customer?: number;
  search?: string;
  ordering?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  active_rentals: number;
  pending_returns: number;
  overdue_returns: number;
  available_products: number;
  low_stock_products: number;
  recent_orders: RentalOrder[];
  revenue_chart_data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  top_products: Array<{
    product: Product;
    rental_count: number;
  }>;
}

// Availability Types
export interface AvailabilityCheck {
  product_id: number;
  start_date: string;
  end_date: string;
  quantity: number;
}

export interface AvailabilityResult {
  available: boolean;
  available_quantity: number;
  conflicts: Array<{
    start_date: string;
    end_date: string;
    quantity: number;
  }>;
  alternative_dates?: Array<{
    start_date: string;
    end_date: string;
  }>;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Utility Types
export type UserType = 'CUSTOMER' | 'BUSINESS';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED' | 'OVERDUE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type DeliveryStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'DAMAGED';

export default {};
