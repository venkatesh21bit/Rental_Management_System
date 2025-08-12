"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Minus, Calendar, Package, 
  CreditCard, MapPin, Search, X, ShoppingCart 
} from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../../utils/auth_fn';

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  category_name: string;
  available_quantity: number;
  brand?: string;
  model?: string;
  image?: string;
  
  // Rental pricing information
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  hourly_rate?: number;
  security_deposit?: number;
  
  // Rental configuration
  rentable: boolean;
  default_rental_unit: string;
  min_rental_duration: number;
  max_rental_duration?: number;
  
  // Availability tracking
  is_available: boolean;
  is_active: boolean;
}

interface OrderItem {
  product: Product;
  quantity: number;
  rental_start: string;
  rental_end: string;
  rental_duration_hours: number;
  rental_unit: string;
  unit_price: number;
  total_price: number;
}

const NewOrderPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/products/products/`);
      if (response.ok) {
        const data = await response.json();
        console.log('Products API Response:', data);
        
        // Handle nested response structure
        if (data.success && data.data && data.data.products) {
          setProducts(data.data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.results) {
          setProducts(data.results);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToOrder = (product: Product) => {
    console.log('Adding product to order:', product);
    const existingItem = orderItems.find(item => item.product.id === product.id);
    if (existingItem) {
      const newQuantity = Math.min(existingItem.quantity + 1, product.available_quantity);
      updateOrderItem(product.id, { quantity: newQuantity });
    } else {
      const defaultDuration = 1; // Default to 1 day
      const unitPrice = product.daily_rate || 0;
      const totalPrice = unitPrice * 1 * defaultDuration;
      
      const newItem: OrderItem = {
        product,
        quantity: 1,
        rental_start: '',
        rental_end: '',
        rental_duration_hours: defaultDuration * 24,
        rental_unit: product.default_rental_unit || 'DAY',
        unit_price: unitPrice,
        total_price: totalPrice
      };
      
      setOrderItems(prev => [...prev, newItem]);
      console.log('Added item to order:', newItem);
    }
  };

  const updateOrderItem = (productId: number, updates: Partial<OrderItem>) => {
    console.log('Updating order item:', productId, updates);
    setOrderItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate total price if quantity changed
        if (updates.quantity !== undefined) {
          const duration = 1; // Will be updated when dates are selected
          updatedItem.total_price = updatedItem.unit_price * updatedItem.quantity * duration;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeFromOrder = (productId: number) => {
    console.log('Removing product from order:', productId);
    setOrderItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    if (!rentalStartDate || !rentalEndDate) return 0;
    
    const start = new Date(rentalStartDate);
    const end = new Date(rentalEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return orderItems.reduce((total, item) => {
      return total + ((item.product.daily_rate || 0) * item.quantity * days);
    }, 0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const steps = [
    { number: 1, title: 'Choose Products', icon: Package },
    { number: 2, title: 'Rental Details', icon: Calendar },
    { number: 3, title: 'Delivery & Review', icon: CreditCard }
  ];

  const createOrder = async () => {
    if (orderItems.length === 0 || !rentalStartDate || !rentalEndDate) {
      alert('Please fill all required fields');
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
      alert('Please fill all delivery address fields');
      return;
    }

    setLoading(true);
    try {
      // First get the current user info to use as customer
      const userResponse = await fetchWithAuth(`${API_URL}/auth/user/`);
      let customerId = null;
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        customerId = userData.id;
      }

      const orderData = {
        customer_id: customerId, // Add the required customer_id field
        rental_start: rentalStartDate,
        rental_end: rentalEndDate,
        items: orderItems.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.daily_rate || 0, // Include unit price
          rental_duration_days: Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24))
        })),
        delivery_address: {
          address_line_1: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          postal_code: deliveryAddress.pincode
        },
        notes: notes.trim() || undefined
      };

      console.log('Creating order with data:', orderData);

      const response = await fetchWithAuth(`${API_URL}/orders/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        alert('Order created successfully!');
        router.push(`/retailer/orders/${order.id}`);
      } else {
        const errorData = await response.json();
        console.error('Order creation failed:', errorData);
        alert(`Failed to create order: ${errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Rental Order</h1>
              <p className="text-neutral-400">Create a new rental order for products</p>
            </div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-neutral-600 text-neutral-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-white' : 'text-neutral-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-neutral-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
          {/* Step 1: Choose Products */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Choose Products for Rental</h2>
              
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-80 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-neutral-400 text-sm">
                  {filteredProducts.length} product(s) found
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-neutral-400">No products found. Try adjusting your search.</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div key={product.id} className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                      <div className="space-y-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded" />
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{product.name}</h3>
                          <p className="text-neutral-400 text-sm">{product.description}</p>
                          <p className="text-blue-400 font-medium">
                            {product.daily_rate ? `₹${product.daily_rate}/day` : 'Price on request'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm px-2 py-1 rounded ${
                            product.available_quantity > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {product.available_quantity > 0 ? `Available (${product.available_quantity})` : 'Not Available'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Button clicked for product:', product.name);
                              addToOrder(product);
                            }}
                            disabled={product.available_quantity === 0}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50 text-white font-medium transition-colors"
                          >
                            Add to Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {orderItems.length > 0 && (
                <div className="bg-neutral-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Selected Products ({orderItems.length})</h3>
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between text-white">
                        <span>{item.product.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (item.quantity <= 1) {
                                removeFromOrder(item.product.id);
                              } else {
                                updateOrderItem(item.product.id, { quantity: item.quantity - 1 });
                              }
                            }}
                            className="w-6 h-6 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const maxQty = item.product.available_quantity;
                              if (item.quantity < maxQty) {
                                updateOrderItem(item.product.id, { quantity: item.quantity + 1 });
                              }
                            }}
                            className="w-6 h-6 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeFromOrder(item.product.id);
                            }}
                            className="ml-2 text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Rental Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Rental Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rental Start Date
                  </label>
                  <input
                    type="date"
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rental End Date
                  </label>
                  <input
                    type="date"
                    value={rentalEndDate}
                    onChange={(e) => setRentalEndDate(e.target.value)}
                    min={rentalStartDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {rentalStartDate && rentalEndDate && (
                <div className="bg-neutral-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {orderItems.map(item => {
                      const days = Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24));
                      const itemTotal = (item.product.daily_rate || 0) * item.quantity * days;
                      return (
                        <div key={item.product.id} className="flex justify-between">
                          <span>{item.product.name} × {item.quantity} for {days} days</span>
                          <span>₹{itemTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-neutral-600 pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Delivery & Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Delivery Address & Review</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Address</h3>
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                      className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                      className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Pincode *"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                    required
                  />
                  <textarea
                    placeholder="Additional Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
                  />
                </div>

                <div className="bg-neutral-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Final Order Summary</h3>
                  <div className="space-y-2">
                    {orderItems.map(item => {
                      const days = Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24));
                      const itemTotal = (item.product.daily_rate || 0) * item.quantity * days;
                      return (
                        <div key={item.product.id} className="flex justify-between">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>₹{itemTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-neutral-600 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount</span>
                        <span>₹{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-4">
            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && orderItems.length === 0) {
                    alert('Please select at least one product');
                    return;
                  }
                  if (currentStep === 2 && (!rentalStartDate || !rentalEndDate)) {
                    alert('Please select rental dates');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={createOrder}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;
