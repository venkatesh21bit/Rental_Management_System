'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  AlertCircle
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  totalCustomers: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    product_name: string;
    total_orders: number;
    total_revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    description: string;
    amount?: number;
  }>;
}

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    totalCustomers: 0,
    monthlyRevenue: [],
    topProducts: [],
    ordersByStatus: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('last_30_days');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics data
        const response = await fetchWithAuth(`${API_URL}/vendor/analytics/?period=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // If vendor analytics endpoint doesn't exist, simulate data
          await fetchBasicData();
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        await fetchBasicData();
      } finally {
        setLoading(false);
      }
    };

    const fetchBasicData = async () => {
      try {
        // Fetch basic data from existing endpoints
        const [productsRes, ordersRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/catalog/products/`),
          fetchWithAuth(`${API_URL}/orders/orders/`)
        ]);

        let totalRevenue = 0;
        let totalOrders = 0;
        let activeProducts = 0;
        const customers = new Set();

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          activeProducts = productsData.results?.filter((p: any) => p.status === 'active')?.length || 0;
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = ordersData.results || [];
          totalOrders = orders.length;
          
          orders.forEach((order: any) => {
            totalRevenue += parseFloat(order.total_amount) || 0;
            if (order.customer?.id) {
              customers.add(order.customer.id);
            }
          });
        }

        setAnalytics(prev => ({
          ...prev,
          totalRevenue,
          totalOrders,
          activeProducts,
          totalCustomers: customers.size
        }));
      } catch (err) {
        console.error('Error fetching basic data:', err);
        setError('Failed to load analytics data');
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-12 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your rental business performance</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.activeProducts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-sm text-gray-600">{product.total_orders} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.total_revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No product data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.ordersByStatus.length > 0 ? (
              <div className="space-y-3">
                {analytics.ordersByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'completed' ? 'bg-green-500' :
                        status.status === 'active' ? 'bg-blue-500' :
                        status.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="capitalize">{status.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{status.count}</span>
                      <span className="text-sm text-gray-500">
                        ({formatPercentage(status.count, analytics.totalOrders)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No order status data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.monthlyRevenue.length > 0 ? (
            <div className="space-y-4">
              {analytics.monthlyRevenue.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-gray-600">{month.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(month.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Revenue trend data will appear as you get more orders</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
