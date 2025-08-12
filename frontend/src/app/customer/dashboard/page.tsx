'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Link from 'next/link';
import { 
  ShoppingBagIcon,
  ClockIcon,
  TruckIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
  activeRentals: number;
  completedOrders: number;
  pendingReturns: number;
  totalSpent: number;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
      
      // Load user statistics - with fallback for API errors
      try {
        const statsResponse = await orderService.getOrderStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        } else {
          // Set default stats if API fails
          setStats({
            activeRentals: 0,
            completedOrders: 0,
            pendingReturns: 0,
            totalSpent: 0
          });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Set default stats if API fails
        setStats({
          activeRentals: 0,
          completedOrders: 0,
          pendingReturns: 0,
          totalSpent: 0
        });
      }

      // Load recent orders - with fallback for API errors
      try {
        const ordersResponse = await orderService.getCustomerOrderHistory(user?.id, 1, 5);
        if (ordersResponse.success) {
          setRecentOrders(ordersResponse.data?.results || []);
        } else {
          setRecentOrders([]);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data
      setStats({
        activeRentals: 0,
        completedOrders: 0,
        pendingReturns: 0,
        totalSpent: 0
      });
      setRecentOrders([]);
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
              <h1 className="text-heading-2">Welcome back, {user?.first_name}!</h1>
              <p className="text-body mt-1">Manage your rentals and explore new products</p>
            </div>
            <Link href="/customer/browse">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-padding py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
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
                <div className="p-2 bg-success-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.completedOrders || 0}
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
                  <p className="text-sm text-gray-600">Pending Returns</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.pendingReturns || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-info-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats?.totalSpent?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total_amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'COMPLETED' ? 'bg-success-100 text-success-800' :
                          order.status === 'PENDING' ? 'bg-warning-100 text-warning-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <Link href="/customer/browse" className="text-primary-600 hover:text-primary-500">
                      Start browsing products
                    </Link>
                  </div>
                )}
              </div>
              {recentOrders.length > 0 && (
                <div className="mt-6">
                  <Link href="/customer/orders">
                    <Button variant="outline" className="w-full">
                      View All Orders
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/customer/browse">
                  <Button className="w-full justify-start">
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    Browse Products
                  </Button>
                </Link>
                
                <Link href="/customer/orders">
                  <Button variant="outline" className="w-full justify-start">
                    <ClockIcon className="h-5 w-5 mr-3" />
                    View My Orders
                  </Button>
                </Link>
                
                <Link href="/customer/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <ChartBarIcon className="h-5 w-5 mr-3" />
                    Update Profile
                  </Button>
                </Link>
                
                <Link href="/customer/support">
                  <Button variant="ghost" className="w-full justify-start">
                    <TruckIcon className="h-5 w-5 mr-3" />
                    Get Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
