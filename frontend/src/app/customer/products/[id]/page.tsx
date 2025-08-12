'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Product } from '../../../../types';
import { productService } from '../../../../services/productService';
import { wishlistService } from '../../../../services/wishlistService';
import { orderService } from '../../../../services/orderService';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import Button from '../../../../components/ui/Button';
import { 
  HeartIcon,
  ShareIcon,
  StarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (startDate && endDate && product) {
      checkAvailability();
    }
  }, [startDate, endDate, quantity]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProduct(parseInt(productId));
      if (response.success && response.data) {
        setProduct(response.data);
        // Check if already in wishlist using API
        try {
          const wishlistResponse = await wishlistService.isInWishlist(response.data.id);
          if (wishlistResponse.success && wishlistResponse.data) {
            setIsWishlisted(wishlistResponse.data.is_wishlisted);
          }
        } catch (error) {
          console.error('Error checking wishlist status:', error);
          // Fallback to localStorage for backward compatibility
          const savedWishlist = localStorage.getItem('wishlist');
          if (savedWishlist) {
            const wishlistIds = JSON.parse(savedWishlist);
            setIsWishlisted(wishlistIds.includes(response.data.id));
          }
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!product || !startDate || !endDate) return;
    
    try {
      setAvailabilityLoading(true);
      const response = await productService.checkAvailability(
        product.id,
        startDate,
        endDate,
        quantity
      );
      
      if (response.success && response.data) {
        setAvailability({
          available: response.data.available,
          message: response.data.available ? 'Available for selected dates' : 'Not available for selected dates'
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({
        available: false,
        message: 'Error checking availability'
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    
    try {
      let response;
      if (isWishlisted) {
        response = await wishlistService.removeFromWishlist(product.id);
      } else {
        response = await wishlistService.addToWishlist(product.id);
      }
      
      if (response.success) {
        setIsWishlisted(!isWishlisted);
      } else {
        console.error('Error updating wishlist:', response.errors);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Fallback to localStorage for backward compatibility
      const savedWishlist = localStorage.getItem('wishlist');
      let wishlistIds = savedWishlist ? JSON.parse(savedWishlist) : [];
      
      if (isWishlisted) {
        wishlistIds = wishlistIds.filter((id: number) => id !== product.id);
      } else {
        wishlistIds.push(product.id);
      }
      
      localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
      setIsWishlisted(!isWishlisted);
    }
  };

  const addToCart = async () => {
    if (!product || !startDate || !endDate) return;
    
    try {
      const cartItem = {
        product: product,
        quantity,
        start_date: startDate,
        end_date: endDate,
      };
      
      orderService.addToCart(cartItem);
      alert('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to localStorage for backward compatibility
      const cartItem = {
        product,
        quantity,
        startDate,
        endDate,
        rental_rate: product.rental_rate
      };
      
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      alert('Added to cart successfully!');
    }
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Check out this rental: ${product?.name}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Product link copied to clipboard!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const days = calculateDays();
    return product.rental_rate * quantity * days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = '/customer/browse'}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]?.image || product.images[0].image}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-8xl">📦</div>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image: { image: string }, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image.image}
                    alt={`${product.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                {product.category && (
                  <p className="text-sm text-blue-600 font-medium">{product.category.name}</p>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleWishlist}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={shareProduct}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ShareIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating!) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.rating.toFixed(1)} (24 reviews)
                </span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.rental_rate)}
                  <span className="text-sm font-normal text-gray-600">/day</span>
                </p>
                {product.weekly_price && (
                  <p className="text-sm text-gray-600">
                    {formatPrice(product.weekly_price)}/week
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  (product.available_quantity || 0) > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(product.available_quantity || 0) > 0 ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Available ({product.available_quantity} units)
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Out of Stock
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rental Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Rental Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[...Array(Math.min(10, product.available_quantity || 1))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Check */}
            {startDate && endDate && (
              <div className="p-3 rounded-lg border">
                {availabilityLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm text-gray-600">Checking availability...</span>
                  </div>
                ) : availability ? (
                  <div className={`flex items-center space-x-2 ${
                    availability.available ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {availability.available ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{availability.message}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Price Calculation */}
          {startDate && endDate && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Rental Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{calculateDays()} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{quantity} unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate per day:</span>
                  <span>{formatPrice(product.rental_rate)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={addToCart}
              disabled={!startDate || !endDate || !availability?.available || (product.available_quantity || 0) === 0}
              className="w-full flex items-center justify-center space-x-2"
              size="lg"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Add to Cart</span>
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => window.location.href = '/customer/browse'}
                variant="outline"
                className="flex items-center justify-center"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={toggleWishlist}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <HeartIcon className="h-4 w-4" />
                <span>{isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
            
            {/* Description */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Flexible rental periods</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Same-day pickup available</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Quality guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
