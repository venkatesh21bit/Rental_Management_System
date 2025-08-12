'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  Eye,
  Plus,
  ShoppingCart
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  items: Array<{
    product_name: string;
    start_date: string;
    end_date: string;
  }>;
  total_amount: number;
  created_at: string;
}

export default function EndUserDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch vendor's products (remove vendor filter if not supported)
        const productsResponse = await fetchWithAuth(`${API_URL}/catalog/products/`);
        let totalProducts = 0;
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          // Filter to only products owned by this user if needed
          const products = productsData.results || [];
          totalProducts = products.length;
        }

        // Fetch vendor's orders (remove vendor filter if not supported)
        const ordersResponse = await fetchWithAuth(`${API_URL}/orders/orders/?limit=5`);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const orders = ordersData.results || [];
          setRecentOrders(orders);

          // Calculate stats from the orders data
          const activeOrders = orders.filter((order: any) => 
            ['active', 'confirmed'].includes(order.status?.toLowerCase())
          ).length;
          const pendingOrders = orders.filter((order: any) => 
            order.status?.toLowerCase() === 'pending'
          ).length;
          const totalRevenue = orders.reduce((sum: number, order: any) => 
            sum + (parseFloat(order.total_amount) || 0), 0
          );
          
          setStats({
            totalProducts,
            activeOrders,
            totalRevenue,
            pendingOrders
          });
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-800 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center bg-gray-800 border-gray-700">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-300">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Your Vendor Dashboard</h1>
        <p className="text-gray-300">Manage your products, track orders, and monitor your rental business performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">My Products</p>
                <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Orders</p>
                <p className="text-3xl font-bold text-white">{stats.activeOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending Orders</p>
                <p className="text-3xl font-bold text-white">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <Plus className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Add New Product</h3>
              <p className="text-gray-300 mb-4">List a new product for rental</p>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <a href="/end-user/add-product">Add Product</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Manage Products</h3>
              <p className="text-gray-300 mb-4">View and edit your product listings</p>
              <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                <a href="/end-user/products">My Products</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">View Analytics</h3>
              <p className="text-gray-300 mb-4">Track your business performance</p>
              <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                <a href="/end-user/analytics">Analytics</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Orders from Customers
            <Button asChild variant="outline" size="sm">
              <a href="/end-user/orders">View All</a>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Start adding products to receive rental orders</p>
              <Button asChild>
                <a href="/end-user/add-product">Add Your First Product</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold">{order.order_number}</h4>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(order.total_amount)}</div>
                      <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                  {order.customer_name && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Customer: {order.customer_name}</p>
                    </div>
                  )}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {order.items.map(item => item.product_name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
