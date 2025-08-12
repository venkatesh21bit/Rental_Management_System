'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/auth-context';
import { apiService } from '@/lib/api-service';
import type { Order } from '@/lib/api-service';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

export default function MyOrders() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiService.orders.getOrders();
        setOrders(response.results || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['active', 'confirmed'].includes(order.status.toLowerCase());
    if (activeTab === 'completed') return order.status.toLowerCase() === 'completed';
    if (activeTab === 'pending') return order.status.toLowerCase() === 'pending';
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="public" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Access Your Orders</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your rental orders.</p>
            <Button>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="customer" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your equipment rental orders
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Order Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      No {activeTab !== 'all' ? activeTab : ''} orders found
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {activeTab === 'all' 
                        ? "You haven't placed any orders yet." 
                        : `You don't have any ${activeTab} orders.`
                      }
                    </p>
                    <Button asChild>
                      <a href="/customer/browse">Browse Equipment</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Placed on {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{order.status}</span>
                              </Badge>
                              <span className="text-lg font-semibold">${order.total_amount}</span>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Order Items */}
                          <div className="space-y-3 mb-4">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <h4 className="font-medium">{item.product_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity} | 
                                    {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline">{item.status}</Badge>
                              </div>
                            ))}
                          </div>

                          {/* Order Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Payment Status</p>
                              <p className="font-medium">{order.payment_status}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Delivery Status</p>
                              <p className="font-medium">{order.delivery_status}</p>
                            </div>
                            {order.delivery_date && (
                              <div>
                                <p className="text-sm text-muted-foreground">Delivery Date</p>
                                <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            {order.return_due_date && (
                              <div>
                                <p className="text-sm text-muted-foreground">Return Due</p>
                                <p className="font-medium">{new Date(order.return_due_date).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </Button>
                            {order.status.toLowerCase() === 'pending' && (
                              <Button variant="outline" size="sm">
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Summary Stats */}
            {orders.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {orders.filter(o => ['active', 'confirmed'].includes(o.status.toLowerCase())).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Orders</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${orders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {orders.filter(o => o.status.toLowerCase() === 'completed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
