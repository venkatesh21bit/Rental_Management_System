'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/userService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (user) {
      // Get the primary address (first one) or use empty strings
      const primaryAddress = user.addresses?.[0];
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: primaryAddress?.street || '',
        city: primaryAddress?.city || '',
        state: primaryAddress?.state || '',
        zip_code: primaryAddress?.postal_code || '',
        country: primaryAddress?.country || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await userService.updateProfile(formData);
      if (response.success && response.data) {
        updateUser(response.data);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      // Get the primary address (first one) or use empty strings
      const primaryAddress = user.addresses?.[0];
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: primaryAddress?.street || '',
        city: primaryAddress?.city || '',
        state: primaryAddress?.state || '',
        zip_code: primaryAddress?.postal_code || '',
        country: primaryAddress?.country || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-2">My Profile</h1>
              <p className="text-body mt-1">Manage your personal information and preferences</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container-padding py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-6 w-6 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${errors.first_name ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your first name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-error-600">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${errors.last_name ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-error-600">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${errors.email ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Address Information
                  </h3>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your city"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your state"
                      />
                    </div>

                    <div>
                      <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        id="zip_code"
                        name="zip_code"
                        type="text"
                        value={formData.zip_code}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your ZIP code"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Enter your country"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
