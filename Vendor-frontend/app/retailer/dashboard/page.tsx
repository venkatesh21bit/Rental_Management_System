"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, TrendingUp, Package, DollarSign, Calendar, Clock } from 'lucide-react';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';
import { Navbar as RetailerNavbar } from '../../../components/retailer/Navbar';

interface DashboardStats {
  total_rentals: number;
  active_rentals: number;
  total_revenue: number;
  pending_returns: number;
  overdue_rentals: number;
  available_products: number;
}

interface RecentOrder {
  id: number;
  order_id: string;
  customer_name: string;
  status: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  items_count: number;
}

const RentalDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total_rentals: 0,
    active_rentals: 0,
    total_revenue: 0,
    pending_returns: 0,
    overdue_rentals: 0,
    available_products: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await fetchWithAuth(`${API_URL}/dashboard/stats/`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Handle the response structure from the backend
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        } else {
          // Fallback for different response structure
          setStats(statsData);
        }
      }

      // Fetch recent rental orders
      const ordersResponse = await fetchWithAuth(`${API_URL}/orders/orders/?limit=5`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.results || ordersData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'delivered':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'overdue':
        return 'bg-red-900/30 text-red-400';
      case 'returned':
        return 'bg-blue-900/30 text-blue-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Rental Management Dashboard</h1>
              <p className="text-neutral-400 mt-2">
                You have {stats?.active_rentals || 0} active rentals and {stats?.pending_returns || 0} pending returns
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/retailer/orders/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Create New Rental
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Rentals</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats?.total_rentals || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Active Rentals</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats?.active_rentals || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : `₹${(stats?.total_revenue || 0).toLocaleString()}`}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Pending Returns</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats?.pending_returns || 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Overdue</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats?.overdue_rentals || 0}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Available Products</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats?.available_products || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Recent Rental Orders */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Rental Orders</h2>
            <button
              onClick={() => router.push('/retailer/orders')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View All Orders
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-neutral-400">Loading orders...</div>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-400">No rental orders yet.</p>
                <button
                  onClick={() => router.push('/retailer/orders/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                >
                  Create First Rental
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    onClick={() => router.push(`/retailer/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-white">{order.order_id}</h3>
                          <p className="text-neutral-400 text-sm">{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 text-sm">
                            {new Date(order.rental_start_date).toLocaleDateString()} - {new Date(order.rental_end_date).toLocaleDateString()}
                          </p>
                          <p className="text-neutral-400 text-sm">{order.items_count} items</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">₹{order.total_amount?.toLocaleString() || '0'}</p>
                      <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/retailer/products')}
            className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6 hover:bg-neutral-800 transition-colors text-left"
          >
            <Package className="h-8 w-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Manage Products</h3>
            <p className="text-neutral-400 text-sm">View and manage your rental inventory</p>
          </button>

          <button
            onClick={() => router.push('/retailer/deliveries')}
            className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6 hover:bg-neutral-800 transition-colors text-left"
          >
            <TrendingUp className="h-8 w-8 text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Delivery Schedule</h3>
            <p className="text-neutral-400 text-sm">Manage pickups and returns</p>
          </button>

          <button
            onClick={() => router.push('/retailer/payments')}
            className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6 hover:bg-neutral-800 transition-colors text-left"
          >
            <DollarSign className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Payments</h3>
            <p className="text-neutral-400 text-sm">View payment history and invoices</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalDashboard;