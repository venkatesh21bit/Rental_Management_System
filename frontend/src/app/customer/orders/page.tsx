'use client';

import { useState, useEffect } from 'react';
import { orderService } from '../../../services/orderService';
import { RentalOrder } from '../../../types';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Button from '../../../components/ui/Button';
import { 
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'ACTIVE' | 'RETURNED' | 'CANCELLED';

const statusConfig = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon 
  },
  CONFIRMED: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircleIcon 
  },
  PICKED_UP: { 
    label: 'Picked Up', 
    color: 'bg-green-100 text-green-800',
    icon: TruckIcon 
  },
  ACTIVE: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon 
  },
  RETURNED: { 
    label: 'Returned', 
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircleIcon 
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon 
  }
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'start_date' | 'end_date'>('created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [filter, sortBy, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({
        status: filter !== 'all' ? filter : undefined,
        ordering: sortBy === 'created_at' ? '-created_at' : sortBy,
      }, currentPage, 10);

      if (response.success && response.data) {
        setOrders(response.data.results || []);
        setTotalPages(Math.ceil((response.data.count || 0) / 10));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      const response = await orderService.cancelOrder(orderId);
      if (response.success) {
        loadOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage your rental orders
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={loadOrders}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="ACTIVE">Active</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Order Date</option>
              <option value="start_date">Start Date</option>
              <option value="end_date">End Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't placed any orders yet." 
              : `No orders found with status "${statusConfig[filter as OrderStatus]?.label}".`
            }
          </p>
          <Button onClick={() => window.location.href = '/customer/browse'}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.id}
                      </h3>
                      {getStatusBadge(order.status as OrderStatus)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                    <Button
                      onClick={() => window.location.href = `/customer/orders/${order.id}`}
                      variant="outline"
                      size="sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {order.status === 'PENDING' && (
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rental Period</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.start_date)} - {formatDate(order.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Items</p>
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.product?.name} x {item.quantity}
                          </span>
                          <span className="text-gray-600">
                            {formatPrice(item.line_total)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          ... and {order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  variant={currentPage === i + 1 ? 'primary' : 'outline'}
                  size="sm"
                >
                  {i + 1}
                </Button>
              ))}
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
