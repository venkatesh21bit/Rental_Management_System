'use client';

import { useState, useEffect } from 'react';
import { Product } from '../../../types';
import { wishlistService, WishlistItem } from '../../../services/wishlistService';
import ProductCard from '../../../components/ProductCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  HeartIcon,
  ShoppingBagIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      
      // Call real API to get wishlist items
      const response = await wishlistService.getWishlistItems();
      
      if (response.success && response.data) {
        setWishlistItems(response.data.results || []);
      } else {
        // Fallback to localStorage for backward compatibility
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          const wishlistIds = JSON.parse(savedWishlist);
          // TODO: Fetch products by IDs from the API
          setWishlistItems([]);
        } else {
          setWishlistItems([]);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      // Call API to remove from wishlist
      const response = await wishlistService.removeFromWishlist(productId);

      if (response.success) {
        setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
        toast.success('Item removed from wishlist');
      } else {
        // Fallback to localStorage
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          const wishlistIds = JSON.parse(savedWishlist);
          const updatedWishlist = wishlistIds.filter((id: number) => id !== productId);
          localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
          setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
        }
        toast.success('Item removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };

  const addAllToCart = () => {
    const itemsToAdd = selectedItems.size > 0 
      ? wishlistItems.filter(item => selectedItems.has(item.id))
      : wishlistItems;

    // Add items to cart logic here
    console.log('Adding to cart:', itemsToAdd);
    
    // Clear selection after adding
    setSelectedItems(new Set());
  };

  const removeSelectedItems = () => {
    selectedItems.forEach(id => removeFromWishlist(id));
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (productId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === wishlistItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(wishlistItems.map(item => item.product.id)));
    }
  };

  const shareWishlist = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: 'Check out my rental wishlist!',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Wishlist link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <HeartIcon className="h-7 w-7 text-red-500 mr-2" />
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button
                onClick={shareWishlist}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">💝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">
            Start browsing products and save your favorites to see them here.
          </p>
          <Button onClick={() => window.location.href = '/customer/browse'}>
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === wishlistItems.length && wishlistItems.length > 0}
                    onChange={selectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select all ({selectedItems.size} selected)
                  </span>
                </label>
              </div>
              
              {selectedItems.size > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={addAllToCart}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ShoppingBagIcon className="h-4 w-4" />
                    <span>Add Selected to Cart</span>
                  </Button>
                  <Button
                    onClick={removeSelectedItems}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Remove Selected</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((wishlistItem) => (
              <div key={wishlistItem.id} className="relative">
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(wishlistItem.product.id)}
                      onChange={() => toggleSelectItem(wishlistItem.product.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white/80 backdrop-blur-sm"
                    />
                  </label>
                </div>

                {/* Remove Button */}
                <div className="absolute top-3 right-12 z-10">
                  <button
                    onClick={() => removeFromWishlist(wishlistItem.product.id)}
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-red-600 hover:text-red-800"
                    title="Remove from wishlist"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <ProductCard 
                  product={wishlistItem.product} 
                  showWishlist={false}
                />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Wishlist Summary</h3>
                <p className="text-sm text-gray-600">
                  {wishlistItems.length} items • {selectedItems.size} selected
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button
                  onClick={addAllToCart}
                  className="flex items-center space-x-2"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>Add All to Cart</span>
                </Button>
                <Button
                  onClick={() => window.location.href = '/customer/browse'}
                  variant="outline"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
