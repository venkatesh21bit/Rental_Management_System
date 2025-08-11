import apiService, { ApiResponse, PaginatedResponse } from './api'

// Types for delivery management
export interface DeliveryItem {
  id: string
  order_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string
  products: Array<{
    id: string
    name: string
    quantity: number
  }>
  delivery_type: 'pickup' | 'return'
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'completed'
  driver_name?: string
  driver_phone?: string
  notes?: string
  proof_of_delivery?: string
  created_at: string
  updated_at: string
}

export interface DeliveryRoute {
  id: string
  driver_name: string
  driver_phone: string
  vehicle_info: string
  route_date: string
  deliveries: string[] // delivery IDs
  status: 'planned' | 'active' | 'completed'
  total_deliveries: number
  completed_deliveries: number
  estimated_duration: string
}

export interface CreateDeliveryRequest {
  order_id: string
  delivery_type: 'pickup' | 'return'
  scheduled_date: string
  scheduled_time: string
  driver_name?: string
  notes?: string
}

export interface UpdateDeliveryRequest {
  scheduled_date?: string
  scheduled_time?: string
  status?: 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'completed'
  driver_name?: string
  driver_phone?: string
  notes?: string
  proof_of_delivery?: string
}

export interface DeliveryFilters {
  status?: string
  delivery_type?: string
  driver?: string
  date_from?: string
  date_to?: string
  search?: string
}

// Delivery API Service
export class DeliveryApiService {
  
  // Get all deliveries with filters
  async getDeliveries(filters?: DeliveryFilters): Promise<ApiResponse<PaginatedResponse<DeliveryItem>>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const queryString = params.toString()
    const url = queryString ? `/deliveries/?${queryString}` : '/deliveries/'
    
    return await apiService.get<PaginatedResponse<DeliveryItem>>(url)
  }

  // Get delivery by ID
  async getDelivery(id: string): Promise<ApiResponse<DeliveryItem>> {
    return await apiService.get<DeliveryItem>(`/deliveries/${id}/`)
  }

  // Create new delivery
  async createDelivery(deliveryData: CreateDeliveryRequest): Promise<ApiResponse<DeliveryItem>> {
    return await apiService.post<DeliveryItem>('/deliveries/', deliveryData)
  }

  // Update delivery
  async updateDelivery(id: string, updateData: UpdateDeliveryRequest): Promise<ApiResponse<DeliveryItem>> {
    return await apiService.patch<DeliveryItem>(`/deliveries/${id}/`, updateData)
  }

  // Update delivery status
  async updateDeliveryStatus(id: string, status: string, proof?: string): Promise<ApiResponse<DeliveryItem>> {
    const data: any = { status }
    if (proof) data.proof_of_delivery = proof
    
    return await apiService.patch<DeliveryItem>(`/deliveries/${id}/status/`, data)
  }

  // Get delivery routes
  async getDeliveryRoutes(date?: string): Promise<ApiResponse<DeliveryRoute[]>> {
    const url = date ? `/deliveries/routes/?date=${date}` : '/deliveries/routes/'
    return await apiService.get<DeliveryRoute[]>(url)
  }

  // Auto-schedule deliveries (uses Redis/Celery for optimization)
  async autoScheduleDeliveries(date: string): Promise<ApiResponse<{ message: string; scheduled_count: number }>> {
    return await apiService.post<{ message: string; scheduled_count: number }>('/deliveries/auto-schedule/', {
      date
    })
  }

  // Get delivery analytics
  async getDeliveryAnalytics(date_from?: string, date_to?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (date_from) params.append('date_from', date_from)
    if (date_to) params.append('date_to', date_to)
    
    const queryString = params.toString()
    const url = queryString ? `/deliveries/analytics/?${queryString}` : '/deliveries/analytics/'
    
    return await apiService.get(url)
  }

  // Trigger automatic delivery workflow for an order (Redis/Celery)
  async triggerDeliveryWorkflow(orderId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(`/deliveries/trigger-workflow/`, {
      order_id: orderId
    })
  }

  // Get nearby drivers for delivery optimization
  async getNearbyDrivers(latitude: number, longitude: number, radius?: number): Promise<ApiResponse<any[]>> {
    return await apiService.get(`/deliveries/nearby-drivers/?lat=${latitude}&lng=${longitude}&radius=${radius || 10}`)
  }
}

export const deliveryApi = new DeliveryApiService()
