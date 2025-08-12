'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithAuth, API_URL } from '@/utils/auth_fn';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle,
  Camera
} from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  avatar: string;
  is_vendor: boolean;
  vendor_business_name: string;
  vendor_description: string;
  created_at: string;
}

export default function VendorProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    vendor_business_name: '',
    vendor_description: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${API_URL}/users/me/`);
        if (response.ok) {
          const responseData = await response.json();
          const data = responseData.data || responseData; // Handle both wrapped and unwrapped responses
          setProfile(data);
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            postal_code: data.postal_code || '',
            country: data.country || '',
            vendor_business_name: data.vendor_business_name || '',
            vendor_description: data.vendor_description || ''
          });
        } else {
          setError('Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth(`${API_URL}/users/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedProfile = responseData.data || responseData; // Handle both wrapped and unwrapped responses
        setProfile(updatedProfile);
        setSuccess('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto animate-pulse space-y-6">
            <div className="bg-gray-800 h-12 rounded-lg border border-gray-600"></div>
            <div className="bg-gray-800 h-64 rounded-lg border border-gray-600"></div>
            <div className="bg-gray-800 h-64 rounded-lg border border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-black text-white border border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load profile data</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-300">Manage your account and vendor information</p>
          </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="mb-6 bg-black text-white border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 bg-black text-white border border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Summary */}
        <Card className="mb-6 bg-black text-white border border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-300">{profile.email}</p>
                {profile.vendor_business_name && (
                  <p className="text-sm text-blue-400 font-medium">
                    Business: {profile.vendor_business_name}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>Member since</div>
                <div>{formatDate(profile.created_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>

                <div>
                  <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="bg-gray-900 text-white border border-gray-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <MapPin className="h-5 w-5 mr-2" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address" className="text-gray-300">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  className="bg-gray-900 text-white border border-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-gray-300">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-gray-300">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter your state"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code" className="text-gray-300">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="Enter your postal code"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter your country"
                    className="bg-gray-900 text-white border border-gray-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card className="bg-black text-white border border-gray-300">
            <CardHeader>
              <CardTitle className="text-white">Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vendor_business_name" className="text-gray-300">Business Name</Label>
                <Input
                  id="vendor_business_name"
                  name="vendor_business_name"
                  value={formData.vendor_business_name}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  className="bg-gray-900 text-white border border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="vendor_description" className="text-gray-300">Business Description</Label>
                <textarea
                  id="vendor_description"
                  name="vendor_description"
                  value={formData.vendor_description}
                  onChange={handleInputChange}
                  placeholder="Describe your business and what you offer"
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
