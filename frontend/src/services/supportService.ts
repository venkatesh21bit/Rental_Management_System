import { ApiResponse, PaginatedResponse } from '../types';
import { apiService } from './apiService';

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  description: string;
  created_at: string;
  updated_at: string;
  last_updated: string;
  customer: number;
  assigned_to?: number;
  responses?: SupportResponse[];
}

export interface SupportResponse {
  id: number;
  message: string;
  created_at: string;
  is_staff_response: boolean;
  author: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface CreateTicketData {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

class SupportService {
  // Get all support tickets for current user
  async getTickets(page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<SupportTicket>>> {
    try {
      const response = await apiService.get('/support/tickets/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get single support ticket
  async getTicket(id: number): Promise<ApiResponse<SupportTicket>> {
    try {
      const response = await apiService.get(`/support/tickets/${id}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create new support ticket
  async createTicket(ticketData: CreateTicketData): Promise<ApiResponse<SupportTicket>> {
    try {
      const response = await apiService.post('/support/tickets/', ticketData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Add response to ticket
  async addResponse(ticketId: number, message: string): Promise<ApiResponse<SupportResponse>> {
    try {
      const response = await apiService.post(`/support/tickets/${ticketId}/responses/`, {
        message
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Close ticket
  async closeTicket(ticketId: number): Promise<ApiResponse<SupportTicket>> {
    try {
      const response = await apiService.patch(`/support/tickets/${ticketId}/`, {
        status: 'CLOSED'
      });
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

export const supportService = new SupportService();
