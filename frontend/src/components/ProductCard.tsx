'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../types';
import Button from '../components/ui/Button';
import { 
  HeartIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showWishlist?: boolean;
}

export default function ProductCard({ 
  product, 
  showAddToCart = true, 
  showWishlist = true 
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Add to cart logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
  };

  const getAvailabilityBadge = () => {
    if (product.available_quantity > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Unavailable
        </span>
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <Link href={`/customer/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0].image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-4xl">📦</div>
            </div>
          )}
          
          {/* Wishlist Button */}
          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              {isWishlisted ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            {getAvailabilityBadge()}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Pricing */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(product.rental_price)}
                <span className="text-sm font-normal text-gray-500">/day</span>
              </p>
              {product.weekly_price && (
                <p className="text-sm text-gray-600">
                  {formatPrice(product.weekly_price)}/week
                </p>
              )}
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available Quantity */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>Available: {product.available_quantity} units</span>
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Quick delivery</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      {showAddToCart && (
        <div className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={product.available_quantity === 0 || isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Adding...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <ShoppingBagIcon className="h-4 w-4" />
                <span>Add to Cart</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
