'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '@/lib/api-service';
import { AppNavigation } from '@/components/app-navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'CONFIRMED':
      return <CheckCircle className="h-4 w-4" />;
    case 'IN_PROGRESS':
      return <Truck className="h-4 w-4" />;
    case 'DELIVERED':
      return <CheckCircle className="h-4 w-4" />;
    case 'RETURNED':
      return <Package className="h-4 w-4" />;
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
      return 'default';
    case 'IN_PROGRESS':
      return 'default';
    case 'DELIVERED':
      return 'success';
    case 'RETURNED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Queries
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', { search, status: statusFilter, page: currentPage }],
    queryFn: () => apiService.orders.getOrders({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: currentPage,
    }),
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', { page: currentPage }],
    queryFn: () => {
      // TODO: Implement quotes API when available
      return Promise.resolve({ results: [], count: 0 });
    },
  });

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          <Badge variant={getStatusColor(order.status) as any}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items?.slice(0, 2).map((item: any) => (
            <div key={item.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
              <img
                src={item.product.images?.[0]?.image || '/placeholder-product.jpg'}
                alt={item.product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} • ₹{item.price_per_day}/day
                </p>
              </div>
            </div>
          ))}
          {order.items?.length > 2 && (
            <p className="text-sm text-muted-foreground text-center">
              +{order.items.length - 2} more items
            </p>
          )}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">{format(new Date(order.start_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">{format(new Date(order.end_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Amount</p>
            <p className="font-bold text-lg">₹{parseFloat(order.total_amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{order.duration_days} days</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2">
          <Link href={`/orders/${order.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const QuoteCard = ({ quote }: { quote: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quote #{quote.id}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(quote.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          <Badge variant={quote.status === 'PENDING' ? 'outline' : 'default'}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
          <img
            src={quote.product.images?.[0]?.image || '/placeholder-product.jpg'}
            alt={quote.product.name}
            className="w-12 h-12 object-cover rounded"
          />
          <div className="flex-1">
            <p className="font-medium">{quote.product.name}</p>
            <p className="text-sm text-muted-foreground">{quote.product.category.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">{format(new Date(quote.start_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">{format(new Date(quote.end_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-medium">{quote.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated Total</p>
            <p className="font-bold">₹{quote.estimated_total}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Link href={`/quotes/${quote.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View Quote
            </Button>
          </Link>
          {quote.status === 'APPROVED' && (
            <Button size="sm" className="flex-1">
              Convert to Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders & Quotes</h1>
          <p className="text-muted-foreground">
            Track your rental orders and manage quote requests
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card>
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : orders?.results?.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any orders yet or no orders match your search.
                </p>
                <Link href="/catalog">
                  <Button>Browse Equipment</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {orders?.results?.map((order: any) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>

                {/* Pagination */}
                {orders && orders.count > 20 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!orders.previous}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {Math.ceil(orders.count / 20)}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!orders.next}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-6">
            {/* Quotes List */}
            {quotesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card>
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : quotes?.results?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't requested any quotes yet. Browse our equipment catalog to get started.
                </p>
                <Link href="/catalog">
                  <Button>Browse Equipment</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {quotes?.results?.map((quote: any) => (
                  <QuoteCard key={quote.id} quote={quote} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
