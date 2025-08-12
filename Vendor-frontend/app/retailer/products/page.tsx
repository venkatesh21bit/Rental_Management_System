"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Package, Plus, Calendar, Clock, Star, 
  Filter, CheckCircle, X, Eye, ShoppingCart 
} from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';

interface RentalProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  category_name: string;
  category_path: string;
  rentable: boolean;
  default_rental_unit: string;
  available_quantity: number;
  brand?: string;
  model?: string;
  is_active: boolean;
  is_available: boolean;
  primary_image?: string | null;
  
  // Optional pricing fields (may need to be fetched separately)
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  security_deposit?: number;
  
  // Optional fields for display
  condition?: string;
  images?: string[];
  rating?: number;
  rental_count?: number;
  specifications?: string;
  created_at?: string;
  updated_at?: string;
}

interface RentalCart {
  [productId: number]: {
    quantity: number;
    rental_days: number;
  };
}

const RentalProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<RentalProduct[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<RentalCart>({});
  const [showCartPreview, setShowCartPreview] = useState(false);

  const categories = [
    'Electronics', 'Furniture', 'Tools & Equipment', 'Vehicles', 
    'Sports & Recreation', 'Events & Parties', 'Photography', 'Construction'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  useEffect(() => {
    fetchRentalProducts();
  }, []);

  const fetchRentalProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/products/products/`;
      
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCondition) params.append('condition', selectedCondition);
      if (search) params.append('search', search);
      if (priceRange.min) params.append('min_price', priceRange.min);
      if (priceRange.max) params.append('max_price', priceRange.max);
      if (sortBy) params.append('ordering', sortBy);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        // Handle the nested response structure
        if (data.success && data.data && data.data.products) {
          setProducts(data.data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.results) {
          setProducts(data.results);
        } else {
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch rental products');
      }
    } catch (error) {
      console.error('Failed to fetch rental products:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRentalProducts();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search, selectedCategory, selectedCondition, sortBy, priceRange]);

  const addToCart = (product: RentalProduct, days: number = 1) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        quantity: (prev[product.id]?.quantity || 0) + 1,
        rental_days: days
      }
    }));
  };

  const updateCartItem = (productId: number, updates: Partial<{ quantity: number; rental_days: number }>) => {
    setCart(prev => {
      const current = prev[productId];
      if (!current) return prev;
      
      if (updates.quantity !== undefined && updates.quantity <= 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      
      return {
        ...prev,
        [productId]: {
          ...current,
          ...updates
        }
      };
    });
  };

  const calculateItemTotal = (product: RentalProduct, cartItem: { quantity: number; rental_days: number }) => {
    const { quantity, rental_days } = cartItem;
    let rate = product.daily_rate || 100;
    
    // Apply weekly/monthly rates if available and more economical
    if (rental_days >= 30 && product.monthly_rate) {
      const months = Math.ceil(rental_days / 30);
      rate = product.monthly_rate / 30;
    } else if (rental_days >= 7 && product.weekly_rate) {
      const weeks = Math.ceil(rental_days / 7);
      rate = product.weekly_rate / 7;
    }
    
    return rate * quantity * rental_days;
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, cartItem]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) return total;
      return total + calculateItemTotal(product, cartItem);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase()) ||
      (product.category_name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category_name === selectedCategory;
    const matchesCondition = selectedCondition === '' || (product.condition || '') === selectedCondition;
    
    const dailyRate = product.daily_rate || 0;
    const matchesPriceRange = (!priceRange.min || dailyRate >= parseFloat(priceRange.min)) &&
                             (!priceRange.max || dailyRate <= parseFloat(priceRange.max));
    
    return matchesSearch && matchesCategory && matchesCondition && matchesPriceRange;
  });

  const sortedProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'daily_rate':
        return (a.daily_rate || 0) - (b.daily_rate || 0);
      case '-daily_rate':
        return (b.daily_rate || 0) - (a.daily_rate || 0);
      case '-rating':
        return (b.rating || 0) - (a.rating || 0);
      case '-rental_count':
        return (b.rental_count || 0) - (a.rental_count || 0);
      case 'available_quantity':
        return b.available_quantity - a.available_quantity;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const createRentalOrder = () => {
    if (Object.keys(cart).length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Store cart in session storage and navigate to order creation
    sessionStorage.setItem('rentalCart', JSON.stringify(cart));
    router.push('/retailer/orders/new');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Rental Products</h1>
            <p className="text-neutral-400 mt-1">Browse and rent products for your business needs</p>
          </div>
          
          {getCartItemCount() > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCartPreview(!showCartPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartItemCount()} items • ₹{getCartTotal().toLocaleString()}
              </button>
              
              {showCartPreview && (
                <div className="absolute right-0 top-12 w-80 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg z-10 p-4">
                  <h3 className="font-semibold mb-3">Rental Cart</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(cart).map(([productId, cartItem]) => {
                      const product = products.find(p => p.id === parseInt(productId));
                      if (!product) return null;
                      
                      return (
                        <div key={productId} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-neutral-400">
                              {cartItem.quantity} × {cartItem.rental_days} days
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{calculateItemTotal(product, cartItem).toLocaleString()}</p>
                            <button
                              onClick={() => updateCartItem(parseInt(productId), { quantity: 0 })}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-neutral-700 pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{getCartTotal().toLocaleString()}</span>
                    </div>
                    <button
                      onClick={createRentalOrder}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                    >
                      Create Rental Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
            />

            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
            />
          </div>
          
          <div className="mt-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="daily_rate">Price: Low to High</option>
              <option value="-daily_rate">Price: High to Low</option>
              <option value="-rating">Highest Rated</option>
              <option value="-rental_count">Most Popular</option>
              <option value="available_quantity">Availability</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">
              {sortedProducts.length} Rental Products Available
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-neutral-400">Loading rental products...</div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
                <p className="text-neutral-400">
                  {search || selectedCategory || selectedCondition || priceRange.min || priceRange.max
                    ? 'Try adjusting your filters'
                    : 'No rental products available at the moment'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map(product => (
                  <div key={product.id} className="border border-neutral-700 rounded-lg p-4 hover:shadow-lg hover:border-neutral-600 transition-all bg-neutral-800">
                    <div className="relative">
                      <img
                        src={(product.images && product.images[0]) || product.primary_image || '/api/placeholder/300/200'}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      {product.rating && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 rounded-full px-2 py-1 flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-white">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white line-clamp-2">{product.name}</h3>
                        <p className="text-neutral-400 text-sm">{product.category_name}</p>
                        {product.brand && (
                          <p className="text-neutral-500 text-sm">{product.brand}</p>
                        )}
                      </div>
                      
                      <p className="text-neutral-400 text-sm line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-white">
                            {product.daily_rate ? `₹${product.daily_rate}/day` : 'Price on request'}
                          </span>
                          {product.weekly_rate && (
                            <p className="text-sm text-neutral-400">₹{product.weekly_rate}/week</p>
                          )}
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          product.available_quantity > 5 ? 'bg-green-900/30 text-green-400' :
                          product.available_quantity > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {product.available_quantity > 0 ? `${product.available_quantity} available` : 'Not available'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-neutral-400">
                        <span>Condition: {product.condition || 'Good'}</span>
                        {product.rental_count && (
                          <span>{product.rental_count} rentals</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {cart[product.id] ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCartItem(product.id, { 
                                    quantity: cart[product.id].quantity - 1 
                                  })}
                                  className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-600"
                                >
                                  -
                                </button>
                                <span className="font-medium">{cart[product.id].quantity}</span>
                                <button
                                  onClick={() => updateCartItem(product.id, { 
                                    quantity: Math.min(cart[product.id].quantity + 1, product.available_quantity)
                                  })}
                                  disabled={cart[product.id].quantity >= product.available_quantity}
                                  className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-600 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={cart[product.id].rental_days}
                                  onChange={(e) => updateCartItem(product.id, { 
                                    rental_days: Math.max(1, parseInt(e.target.value) || 1)
                                  })}
                                  className="w-16 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
                                />
                                <span className="text-xs">days</span>
                              </div>
                            </div>
                            <div className="text-center text-sm text-blue-400">
                              Total: ₹{calculateItemTotal(product, cart[product.id]).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => product.daily_rate ? addToCart(product, 1) : alert('Pricing not configured for this product')}
                              disabled={product.available_quantity === 0 || !product.daily_rate}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              {product.available_quantity === 0 
                                ? 'Not Available' 
                                : !product.daily_rate 
                                ? 'Price on Request' 
                                : 'Add to Cart'
                              }
                            </button>
                            <button
                              onClick={() => router.push(`/retailer/products/${product.id}`)}
                              className="bg-neutral-700 text-white py-2 px-3 rounded-lg hover:bg-neutral-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {(product.security_deposit && product.security_deposit > 0) && (
                        <div className="text-xs text-neutral-400">
                          Security deposit: ₹{product.security_deposit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalProductsPage;
