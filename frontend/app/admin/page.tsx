'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';
import { AppNavigation } from '@/components/app-navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiService } from '@/lib/api-service';

const AdminStatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  changeType = 'positive' 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  changeType?: 'positive' | 'negative' | 'neutral';
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Check if user is admin
  if (!user || !(user as any).is_staff) {
    router.push('/');
    return null;
  }

  // Mock data for demonstration
  const statsData = {
    totalUsers: 1234,
    totalProducts: 567,
    activeOrders: 89,
    monthlyRevenue: 45678,
    pendingOrders: 12,
    availableProducts: 89,
  };

  const recentOrders = [
    { id: 1, customer: 'John Doe', product: 'Excavator XL', amount: 2500, status: 'PENDING' },
    { id: 2, customer: 'Jane Smith', product: 'Crane 50T', amount: 3500, status: 'CONFIRMED' },
    { id: 3, customer: 'Bob Johnson', product: 'Bulldozer D6', amount: 4200, status: 'IN_PROGRESS' },
  ];

  const recentUsers = [
    { id: 1, name: 'Alice Brown', email: 'alice@example.com', type: 'BUSINESS', joined: '2 hours ago' },
    { id: 2, name: 'Charlie Wilson', email: 'charlie@example.com', type: 'INDIVIDUAL', joined: '5 hours ago' },
    { id: 3, name: 'Diana Prince', email: 'diana@example.com', type: 'BUSINESS', joined: '1 day ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'default';
      case 'IN_PROGRESS': return 'default';
      case 'DELIVERED': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your rental platform from this central dashboard
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AdminStatsCard
                title="Total Users"
                value={statsData.totalUsers.toLocaleString()}
                change="+12% from last month"
                icon={Users}
                changeType="positive"
              />
              <AdminStatsCard
                title="Total Products"
                value={statsData.totalProducts}
                change="+8 new this month"
                icon={Package}
                changeType="positive"
              />
              <AdminStatsCard
                title="Active Orders"
                value={statsData.activeOrders}
                change="+5% from last week"
                icon={ShoppingCart}
                changeType="positive"
              />
              <AdminStatsCard
                title="Monthly Revenue"
                value={`₹${statsData.monthlyRevenue.toLocaleString()}`}
                change="+20% from last month"
                icon={DollarSign}
                changeType="positive"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₹{order.amount}</p>
                          <Badge variant={getStatusColor(order.status) as any} className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>New user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {user.type}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{user.joined}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Important notifications requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">Pending Approvals</p>
                      <p className="text-xs text-muted-foreground">
                        {statsData.pendingOrders} orders require admin approval
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">System Status</p>
                      <p className="text-xs text-muted-foreground">
                        All systems operational - {statsData.availableProducts} products available
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View and manage all customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                  <p>Order management interface will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>User management interface will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Add, edit, and manage rental products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>Product management interface will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
