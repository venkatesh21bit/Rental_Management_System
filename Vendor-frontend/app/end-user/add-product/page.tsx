'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  Upload,
  X,
  Package,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  daily_rate: string;
  quantity_on_hand: string;
  min_rental_duration: string;
  max_rental_duration: string;
  deposit_amount: string;
  status: string;
}

export default function AddProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    daily_rate: '',
    quantity_on_hand: '1',
    min_rental_duration: '1',
    max_rental_duration: '30',
    deposit_amount: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Starting to fetch categories...');
        setLoading(true);
        setError(null);
        
        const url = `${API_URL}/catalog/categories/`;
        console.log('Fetching from URL:', url);
        
        const response = await fetchWithAuth(url);
        console.log('Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Categories data received:', data);
          
          // Check if data is an array or has results property
          const categoriesArray = Array.isArray(data) ? data : (data.results || []);
          console.log('Categories array:', categoriesArray);
          console.log('Categories count:', categoriesArray.length);
          
          setCategories(categoriesArray);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch categories:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          setError(`Failed to load categories: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Network error while loading categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      setError('You can upload maximum 5 images');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create FormData for file upload
      const submitFormData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) { // Only add non-empty values
          submitFormData.append(key, value);
        }
      });

      // Add required backend fields
      submitFormData.append('sku', `SKU-${Date.now()}`); // Generate unique SKU
      submitFormData.append('rentable', 'true');
      submitFormData.append('is_active', formData.status === 'active' ? 'true' : 'false');

      // Add images
      selectedImages.forEach((image, index) => {
        submitFormData.append('images', image);
        if (index === 0) {
          submitFormData.append('is_primary', 'true');
        }
      });

      console.log('Submitting FormData with keys:', Array.from(submitFormData.keys()));

      const response = await fetchWithAuth(`${API_URL}/catalog/products/`, {
        method: 'POST',
        body: submitFormData,
      });

      if (response.ok) {
        setSuccess('Product added successfully!');
        setTimeout(() => {
          router.push('/end-user/products');
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        setError(JSON.stringify(errorData) || 'Failed to add product');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add New Product</h1>
          <p className="text-white">Create a new rental product listing</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="mb-6 bg-black text-white border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-white">
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 bg-black text-white border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-white">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Package className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                  className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail"
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/60"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {categories.length > 0 ? (
                    categories.map(category => {
                      console.log('Rendering category:', category);
                      return (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      );
                    })
                  ) : (
                    !loading && (
                      <option value="" disabled>
                        No categories available
                      </option>
                    )
                  )}
                </select>
                {/* Debug info */}
                <div className="text-xs text-gray-400 mt-1">
                  Debug: Categories loaded: {categories.length} | Loading: {loading.toString()} | Error: {error || 'none'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity_on_hand" className="text-white">Quantity Available *</Label>
                  <Input
                    id="quantity_on_hand"
                    name="quantity_on_hand"
                    type="number"
                    min="1"
                    value={formData.quantity_on_hand}
                    onChange={handleInputChange}
                    required
                    className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="daily_rate" className="text-white">Daily Rate ($) *</Label>
                <Input
                  id="daily_rate"
                  name="daily_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.daily_rate}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                  className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                />
              </div>

              <div>
                <Label htmlFor="deposit_amount" className="text-white">Security Deposit ($)</Label>
                <Input
                  id="deposit_amount"
                  name="deposit_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rental Terms */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Clock className="h-5 w-5 mr-2" />
                Rental Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_rental_duration" className="text-white">Minimum Rental (days) *</Label>
                  <Input
                    id="min_rental_duration"
                    name="min_rental_duration"
                    type="number"
                    min="1"
                    value={formData.min_rental_duration}
                    onChange={handleInputChange}
                    required
                    className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                  />
                </div>

                <div>
                  <Label htmlFor="max_rental_duration" className="text-white">Maximum Rental (days)</Label>
                  <Input
                    id="max_rental_duration"
                    name="max_rental_duration"
                    type="number"
                    min="1"
                    value={formData.max_rental_duration}
                    onChange={handleInputChange}
                    className="bg-gray-900 text-white border border-gray-700 placeholder:text-white/60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Upload className="h-5 w-5 mr-2" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="images"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-white/60 mx-auto mb-2" />
                      <span className="text-sm text-white">
                        Click to upload images (Max 5)
                      </span>
                    </div>
                  </Label>
                </div>

                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 text-white border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitLoading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}