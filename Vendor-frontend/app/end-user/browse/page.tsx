'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Heart,
  ShoppingCart,
  Package,
  Eye
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  base_price: number;
  hourly_rate?: number;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  category: {
    id: number;
    name: string;
  };
  images: Array<{
    id: number;
    image: string;
    alt_text?: string;
  }>;
  is_available: boolean;
  rental_duration_unit: string;
  min_rental_duration: number;
  max_rental_duration?: number;
}

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

export default function BrowseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (sortBy) params.append('ordering', sortBy);
        if (priceRange.min) params.append('min_price', priceRange.min);
        if (priceRange.max) params.append('max_price', priceRange.max);
        
        console.log('🔍 Fetching products with params:', params.toString());
        
        // Fetch products and categories
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/catalog/products/?${params.toString()}`),
          fetchWithAuth(`${API_URL}/api/catalog/categories/`)
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('📦 Products API Response:', productsData);
          
          // Handle different response structures
          const productsList = productsData.results || productsData.data?.products || productsData.products || [];
          setProducts(productsList);
        } else {
          console.error('❌ Failed to fetch products:', productsResponse.status);
          setError('Failed to load products');
        }
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('📂 Categories API Response:', categoriesData);
          
          const categoriesList = categoriesData.results || categoriesData.data || categoriesData || [];
          setCategories(Array.isArray(categoriesList) ? categoriesList : []);
        } else {
          console.warn('⚠️ Failed to fetch categories, continuing without filters');
          setCategories([]);
        }
        
      } catch (err) {
        console.error('💥 Error fetching data:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, selectedCategory, sortBy, priceRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('name');
    setPriceRange({ min: '', max: '' });
  };

  const addToWishlist = async (productId: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/accounts/wishlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: productId }),
      });
      
      if (response.ok) {
        // Show success feedback (you could add a toast notification here)
        console.log('Added to wishlist successfully');
      }
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
    }
  };

  const getDisplayPrice = (product: Product) => {
    if (product.hourly_rate) return `$${product.hourly_rate}/hour`;
    if (product.daily_rate) return `$${product.daily_rate}/day`;
    if (product.weekly_rate) return `$${product.weekly_rate}/week`;
    if (product.monthly_rate) return `$${product.monthly_rate}/month`;
    return `$${product.base_price}`;
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
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Rental Products</h1>
        <p className="text-gray-600">Discover our wide range of products available for rent</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="base_price">Price: Low to High</option>
                  <option value="-base_price">Price: High to Low</option>
                  <option value="-created_at">Newest First</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {products.map((product) => (
            <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${
              viewMode === 'list' ? 'flex flex-row' : ''
            }`}>
              <div className={viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'}>
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].image}
                    alt={product.images[0].alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                  <button
                    onClick={() => addToWishlist(product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
                
                {product.category && (
                  <Badge variant="secondary" className="mb-2">
                    {product.category.name}
                  </Badge>
                )}
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-green-600">
                    {getDisplayPrice(product)}
                  </div>
                  <div className={`flex items-center text-sm ${
                    product.is_available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <Clock className="h-4 w-4 mr-1" />
                    {product.is_available ? 'Available' : 'Not Available'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={!product.is_available}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Rent Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
