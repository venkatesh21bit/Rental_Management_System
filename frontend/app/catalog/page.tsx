'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppNavigation } from '@/components/app-navigation';
import { catalogApi } from '@/lib/catalog-api';
import type { Product, ProductCategory } from '@/lib/catalog-api';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [currentPage, searchQuery, selectedCategory, sortBy, priceRange]);

  const fetchCategories = async () => {
    try {
      const response = await catalogApi.getCategories();
      if (response.success && response.data) {
        // Ensure we get an array of categories
        const categoriesData = Array.isArray(response.data) ? response.data : [];
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, any> = {
        page: currentPage,
        ordering: sortBy,
      };

      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.category = selectedCategory;
      if (priceRange.min) filters.min_daily_rate = priceRange.min;
      if (priceRange.max) filters.max_daily_rate = priceRange.max;

      const response = await catalogApi.getProducts(filters);
      
      if (response.success && response.data) {
        const products = response.data.items || response.data.products || [];
        setProducts(products);
        
        // Handle pagination from different response structures
        const total = response.data.total || response.data.pagination?.total || 0;
        const totalPages = response.data.totalPages || response.data.pagination?.total_pages || Math.ceil(total / 12);
        
        setTotalPages(totalPages);
        setTotalProducts(total);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);
    if (priceRange.min) params.set('min_price', priceRange.min);
    if (priceRange.max) params.set('max_price', priceRange.max);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    const newURL = queryString ? `/catalog?${queryString}` : '/catalog';
    router.push(newURL);
  };

  const handleProductClick = (productId: number) => {
    router.push(`/catalog/${productId}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('name');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
    router.push('/catalog');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Catalog</h1>
          <p className="text-gray-600">
            Browse our extensive collection of rental equipment
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label htmlFor="search">Search Equipment</Label>
                <div className="flex">
                  <Input
                    id="search"
                    placeholder="Search by name, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="rounded-r-none"
                  />
                  <Button onClick={handleSearch} className="rounded-l-none">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories && categories.length > 0 && categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category?.name || 'Unknown Category'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="-name">Name Z-A</SelectItem>
                    <SelectItem value="daily_rate">Price: Low to High</SelectItem>
                    <SelectItem value="-daily_rate">Price: High to Low</SelectItem>
                    <SelectItem value="-average_rating">Highest Rated</SelectItem>
                    <SelectItem value="-created_at">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Min Daily Rate ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                />
              </div>
              <div>
                <Label>Max Daily Rate ($)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <div className="flex items-center gap-2">
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
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${totalProducts} equipment found`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchProducts}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Products Grid/List */}
        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">No equipment found matching your criteria</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                "grid gap-6 mb-8",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className={cn(
                      viewMode === 'list' ? "flex" : ""
                    )}>
                      {/* Product Image */}
                      <div className={cn(
                        "relative overflow-hidden",
                        viewMode === 'grid' ? "aspect-square" : "w-48 h-32 flex-shrink-0"
                      )}>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]?.image}
                            alt={product.images[0]?.alt_text || product.name || 'Product image'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        
                        {/* Availability Badge */}
                        <Badge 
                          className={cn(
                            "absolute top-2 right-2",
                            product.availability_status === 'AVAILABLE' 
                              ? "bg-green-500" 
                              : "bg-red-500"
                          )}
                        >
                          {product.availability_status || 'UNKNOWN'}
                        </Badge>
                      </div>

                      {/* Product Info */}
                      <div className={cn(
                        "p-4",
                        viewMode === 'list' ? "flex-1" : ""
                      )}>
                        <div className="mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.category?.name || 'No Category'}</p>
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Rating */}
                        {product.average_rating && product.average_rating > 0 && (
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-sm">
                              {product.average_rating.toFixed(1)} ({product.total_reviews || 0})
                            </span>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold">${product.daily_rate || 0}/day</p>
                            <p className="text-xs text-gray-500">
                              ${product.weekly_rate || 0}/week • ${product.monthly_rate || 0}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {product.available_quantity || 0} available
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
