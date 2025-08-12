'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Link from 'next/link';
import { 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserGroupIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  activeRentals: number;
  totalCustomers: number;
  pendingReturns: number;
  availableProducts: number;
}

export default function EndUserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load business statistics
      const statsResponse = await orderService.getOrderStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load recent orders
      const ordersResponse = await orderService.getOrders({}, 1, 5);
      if (ordersResponse.success && ordersResponse.data) {
        setRecentOrders(ordersResponse.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-2">Business Dashboard</h1>
              <p className="text-body mt-1">Welcome back, {user?.first_name}!</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/end-user/products/new">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/end-user/orders">
                <Button variant="outline">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-padding py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats?.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <TruckIcon className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.activeRentals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-info-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalCustomers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Order #{order.id}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'COMPLETED' ? 'bg-success-100 text-success-800' :
                              order.status === 'PENDING' ? 'bg-warning-100 text-warning-800' :
                              order.status === 'CONFIRMED' ? 'bg-primary-100 text-primary-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer: {order.customer?.first_name} {order.customer?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">${order.total_amount}</p>
                          <Link href={`/end-user/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                      <p className="text-sm text-gray-400">Orders will appear here when customers book your products</p>
                    </div>
                  )}
                </div>
                {recentOrders.length > 0 && (
                  <div className="mt-6">
                    <Link href="/end-user/orders">
                      <Button variant="outline" className="w-full">
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/end-user/products/new">
                    <Button className="w-full justify-start">
                      <PlusIcon className="h-5 w-5 mr-3" />
                      Add New Product
                    </Button>
                  </Link>
                  
                  <Link href="/end-user/orders">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBagIcon className="h-5 w-5 mr-3" />
                      Manage Orders
                    </Button>
                  </Link>
                  
                  <Link href="/end-user/products">
                    <Button variant="outline" className="w-full justify-start">
                      <EyeIcon className="h-5 w-5 mr-3" />
                      View Products
                    </Button>
                  </Link>
                  
                  <Link href="/end-user/reports">
                    <Button variant="ghost" className="w-full justify-start">
                      <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                      View Reports
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.pendingReturns && stats.pendingReturns > 0 && (
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                      <p className="text-sm font-medium text-warning-800">
                        {stats.pendingReturns} pending returns
                      </p>
                      <p className="text-xs text-warning-600">
                        Items need to be returned by customers
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-sm font-medium text-success-800">
                      {stats?.availableProducts || 0} products available
                    </p>
                    <p className="text-xs text-success-600">
                      Products ready for rental
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
