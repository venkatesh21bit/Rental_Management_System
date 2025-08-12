'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/auth-context';
import catalogApi, { Product, ProductCategory } from '@/lib/catalog-api';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';

export default function BrowseProducts() {
  const { isAuthenticated } = useAuth();
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products and categories
        console.log('🔍 Fetching products with filters:', {
          search: searchQuery,
          category: selectedCategory === 'all' ? undefined : parseInt(selectedCategory),
          ordering: sortBy,
          min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
          max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
        });
        
        const [productsResponse, categoriesResponse] = await Promise.all([
          catalogApi.getProducts({
            search: searchQuery,
            category: selectedCategory === 'all' ? undefined : parseInt(selectedCategory),
            ordering: sortBy,
            min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
            max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
          }),
          catalogApi.getCategories()
        ]);

        console.log('📦 Products API Response:', productsResponse);
        console.log('📂 Categories API Response:', categoriesResponse);

        // Handle API response properly
        if (productsResponse.success) {
          const products = productsResponse.data?.items || productsResponse.data?.products || productsResponse.data?.results || [];
          console.log('✅ Extracted products:', products);
          setProducts(products);
        } else {
          console.error('❌ Failed to fetch products:', productsResponse.error);
          setProducts([]);
        }
        
        if (categoriesResponse.success) {
          const categoriesData = categoriesResponse.data || [];
          console.log('✅ Extracted categories:', categoriesData);
          // Ensure we have an array
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error('❌ Failed to fetch categories:', categoriesResponse.error);
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
    // Search is already triggered by useEffect when searchQuery changes
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('name');
    setPriceRange({ min: '', max: '' });
  };

  const addToWishlist = async (productId: number) => {
    try {
      await catalogApi.addToWishlist(productId);
      // Show success message or update UI
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant={isAuthenticated ? 'customer' : 'public'} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Equipment</h1>
          <p className="text-gray-600">
            Discover our comprehensive range of rental equipment
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(categories) && categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="daily_rate">Price: Low to High</SelectItem>
                <SelectItem value="-daily_rate">Price: High to Low</SelectItem>
                <SelectItem value="-created_at">Newest First</SelectItem>
                <SelectItem value="created_at">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-24"
              />
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>

            <div className="flex gap-2 ml-auto">
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Products Grid/List */}
        {!loading && !error && (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            ) : (
              products.map((product) => (
                <Card key={product.id} className={viewMode === 'list' ? "flex" : ""}>
                  {product.images && product.images.length > 0 && (
                    <div className={viewMode === 'list' ? "w-48 flex-shrink-0" : "h-48"}>
                      <img
                        src={product.images.find(img => img.is_primary)?.image || product.images[0]?.image || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <p className="text-sm text-gray-600">{product.category.name}</p>
                        </div>
                        <Badge variant={product.availability_status === 'AVAILABLE' ? 'default' : 'secondary'}>
                          {product.availability_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">₹{product.daily_rate}/day</span>
                          </div>
                        </div>
                        
                        {product.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{product.average_rating}</span>
                            {product.total_reviews && (
                              <span className="text-sm text-gray-500">({product.total_reviews} reviews)</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          Request Quote
                        </Button>
                        {isAuthenticated && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addToWishlist(product.id)}
                          >
                            ♡
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
