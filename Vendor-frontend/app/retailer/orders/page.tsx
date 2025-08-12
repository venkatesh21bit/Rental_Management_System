"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Clock, CheckCircle, X, Eye, Package } from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';

interface RentalOrder {
  id: number;
  order_id: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  status: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  deposit_amount: number;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    daily_rate: number;
  }>;
}

const RentalOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [filter, currentPage, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/orders/orders/?page=${currentPage}`;
      
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.results || data);
        if (data.count) {
          setTotalPages(Math.ceil(data.count / 20)); // Assuming 20 items per page
        }
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-900/30 text-blue-400';
      case 'delivered':
      case 'active':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'returned':
        return 'bg-gray-900/30 text-gray-400';
      case 'overdue':
        return 'bg-red-900/30 text-red-400';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
      case 'active':
        return <Package className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/retailer/orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    router.push('/retailer/orders/new');
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.order_id.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Rental Orders</h1>
            <p className="text-neutral-400 mt-1">Manage all rental orders and bookings</p>
          </div>
          <button
            onClick={handleCreateOrder}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Rental Order
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-neutral-300 text-sm font-medium">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="active">Active</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">
              Orders ({filteredOrders.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-neutral-400">Loading orders...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-400 mb-4">
                {searchTerm || filter !== 'all' ? 'No orders match your criteria.' : 'No rental orders yet.'}
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={handleCreateOrder}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Create First Order
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-white">
                          {order.order_id}
                        </h3>
                        <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-neutral-400">
                        <span>Customer: {order.customer.name}</span>
                        <span>Email: {order.customer.email}</span>
                        {order.customer.phone && <span>Phone: {order.customer.phone}</span>}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.rental_start_date).toLocaleDateString()} - {new Date(order.rental_end_date).toLocaleDateString()}
                        </span>
                        <span>{order.items?.length || 0} items</span>
                        <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-xl font-bold text-white">
                          ₹{order.total_amount?.toLocaleString() || '0'}
                        </p>
                        {order.deposit_amount > 0 && (
                          <p className="text-sm text-neutral-400">
                            Deposit: ₹{order.deposit_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg disabled:opacity-50 hover:bg-neutral-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg disabled:opacity-50 hover:bg-neutral-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalOrdersPage;