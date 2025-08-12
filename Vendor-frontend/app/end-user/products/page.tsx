'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  category_name: string;
  price_per_day: number;
  price_per_hour: number;
  price_per_week: number;
  status?: string;
  availability_status?: string;
  images: Array<{ id: number; image: string; is_primary: boolean }>;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_revenue?: number;
}

export default function MyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Check if user is authenticated
        const token = localStorage.getItem("access_token");
        console.log("🔍 Debug - Token exists:", !!token);
        console.log("🔍 Debug - Token:", token ? token.substring(0, 20) + "..." : "null");
        console.log("🔍 Debug - API_URL:", API_URL);
        
        if (!token) {
          setError('Please log in to view your products');
          setLoading(false);
          // Redirect to authentication page
          setTimeout(() => {
            router.push('/authentication');
          }, 2000);
          return;
        }
        
        let url = `${API_URL}/catalog/products/`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        if (filterStatus !== 'all') {
          url += `${searchQuery ? '&' : '?'}status=${filterStatus}`;
        }
        
        console.log("🔍 Debug - API URL:", url);
        
        const response = await fetchWithAuth(url);
        console.log("🔍 Debug - Response status:", response.status);
        console.log("🔍 Debug - Response ok:", response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Debug - Response data:", data);
          
          // Handle different response formats based on the actual API response
          if (data.success && data.data && data.data.products) {
            // New API format: {success: true, data: {products: [...]}}
            setProducts(data.data.products || []);
          } else if (data.results) {
            // Paginated format: {results: [...], count: x, next: null, previous: null}
            setProducts(data.results || []);
          } else if (Array.isArray(data)) {
            // Direct array format: [...]
            setProducts(data);
          } else {
            // Fallback
            console.warn("Unexpected data format:", data);
            setProducts([]);
          }
        } else {
          const errorData = await response.text();
          console.error("🔍 Debug - Error response:", errorData);
          setError(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Failed to load products: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, filterStatus]);

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/catalog/products/${productId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-12 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
            <p className="text-gray-600">Manage your rental product listings</p>
          </div>
          <Button asChild>
            <a href="/end-user/add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </a>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {error && (
        <Card className="mb-6 bg-black text-white border border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start by adding your first product for rental'
            }
          </p>
          <Button asChild>
            <a href="/end-user/add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden bg-black text-white border border-gray-300">
              <div className="aspect-video bg-gray-100 relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {product.status && (
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  )}
                  {product.availability_status && (
                    <Badge className={getAvailabilityColor(product.availability_status)}>
                      {product.availability_status}
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-white">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{product.category_name}</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-400">Per Hour: </span>
                    <span className="font-medium text-white">{formatCurrency(product.price_per_hour)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Per Day: </span>
                    <span className="font-medium text-white">{formatCurrency(product.price_per_day)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Per Week: </span>
                    <span className="font-medium text-white">{formatCurrency(product.price_per_week)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Orders: </span>
                    <span className="font-medium text-white">{product.total_orders || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Updated {formatDate(product.updated_at)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <a href={`/end-user/products/${product.id}`}>
                        <Eye className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <a href={`/end-user/products/${product.id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-400 hover:text-red-300 border-gray-600 hover:bg-gray-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
