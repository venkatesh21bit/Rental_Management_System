'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  Search,
  Filter,
  Eye,
  Package,
  Clock,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      images: Array<{ image: string; is_primary: boolean }>;
    };
    quantity: number;
    start_date: string;
    end_date: string;
    unit_price: number;
    total_price: number;
  }>;
  total_amount: number;
  payment_status: string;
  pickup_date: string;
  return_date: string;
  created_at: string;
  updated_at: string;
  notes: string;
}

export default function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        let url = `${API_URL}/orders/orders/`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        if (statusFilter !== 'all') {
          url += `${searchQuery ? '&' : '?'}status=${statusFilter}`;
        }
        
        const response = await fetchWithAuth(url);
        if (response.ok) {
          const data = await response.json();
          setOrders(data.results || []);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchQuery, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      
      const response = await fetchWithAuth(`${API_URL}/orders/orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-white';
      case 'confirmed':
        return 'bg-blue-100 text-white';
      case 'active':
        return 'bg-green-100 text-white';
      case 'completed':
        return 'bg-gray-100 text-white';
      case 'cancelled':
        return 'bg-red-100 text-white';
      default:
        return 'bg-gray-100 text-white';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-white';
      case 'pending':
        return 'bg-yellow-100 text-white';
      case 'failed':
        return 'bg-red-100 text-white';
      default:
        return 'bg-gray-100 text-white';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusActions = (order: Order) => {
    const actions = [];
    
    switch (order.status.toLowerCase()) {
      case 'pending':
        actions.push(
          <Button
            key="confirm"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'confirmed')}
            disabled={updating === order.id}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            Confirm
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={() => updateOrderStatus(order.id, 'cancelled')}
            disabled={updating === order.id}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
        );
        break;
      case 'confirmed':
        actions.push(
          <Button
            key="activate"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'active')}
            disabled={updating === order.id}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            Mark as Active
          </Button>
        );
        break;
      case 'active':
        actions.push(
          <Button
            key="complete"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'completed')}
            disabled={updating === order.id}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            Mark as Completed
          </Button>
        );
        break;
    }
    
    return actions;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-12 rounded-lg"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
        <p className="text-white">Manage orders for your rental products</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4" />
          <Input
            placeholder="Search by order number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 text-white border border-gray-700 placeholder:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <Card className="mb-6 bg-black text-white border border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-white">
              <AlertCircle className="h-5 w-5 text-white" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-white mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
          <p className="text-white mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Orders for your products will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="bg-black text-white border border-gray-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{order.order_number}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        Payment: {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{formatCurrency(order.total_amount)}</div>
                    <div className="text-sm text-white">{formatDate(order.created_at)}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Customer Info */}
                <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-white" />
                    <span className="font-medium text-white">Customer:</span>
                    <span className="text-white">{order.customer.first_name} {order.customer.last_name}</span>
                    <span className="text-white">({order.customer.email})</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 border border-gray-700 rounded-lg">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images.find(img => img.is_primary)?.image || item.product.images[0].image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-full h-full p-2 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.product.name}</h4>
                        <div className="text-sm text-white">
                          Quantity: {item.quantity}
                        </div>
                        <div className="text-sm text-white">
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-white">{formatCurrency(item.total_price)}</div>
                        <div className="text-sm text-white">
                          {formatCurrency(item.unit_price)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rental Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">
                      <span className="font-medium">Pickup:</span> {formatDate(order.pickup_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">
                      <span className="font-medium">Return:</span> {formatDate(order.return_date)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                    <div className="text-sm text-white">
                      <span className="font-medium">Notes:</span> {order.notes}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {getStatusActions(order)}
                    {updating === order.id && (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    )}
                  </div>
                  
                  <Button size="sm" variant="outline" asChild className="border-gray-600 text-white hover:bg-gray-700 hover:text-white">
                    <a href={`/end-user/orders/${order.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}