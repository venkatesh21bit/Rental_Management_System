"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, X, Package, User, 
  MapPin, Phone, Mail, CreditCard, Truck, Edit, Download 
} from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../../utils/auth_fn';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  daily_rate: number;
  total_amount: number;
  product_image?: string;
}

interface OrderDetails {
  id: number;
  order_id: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  status?: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount?: number;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment_status?: string;
  payment_method?: string;
  notes?: string;
}

const OrderDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentProviders, setPaymentProviders] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
      fetchPaymentProviders();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}/orders/orders/${params.id}/`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        console.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetchWithAuth(`${API_URL}/orders/orders/${params.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrderDetails();
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      alert('Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const fetchPaymentProviders = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/payments/order-payment/providers/`);
      if (response.ok) {
        const result = await response.json();
        // Handle different response formats
        if (Array.isArray(result)) {
          setPaymentProviders(result);
        } else if (result.data && Array.isArray(result.data)) {
          setPaymentProviders(result.data);
        } else if (result.providers && Array.isArray(result.providers)) {
          setPaymentProviders(result.providers);
        } else if (result.results && Array.isArray(result.results)) {
          setPaymentProviders(result.results);
        } else {
          console.error('Invalid payment providers response format:', result);
          setPaymentProviders([]);
        }
      } else {
        console.error('Failed to fetch payment providers:', response.status);
        setPaymentProviders([]);
      }
    } catch (error) {
      console.error('Error fetching payment providers:', error);
      setPaymentProviders([]);
    }
  };

  const createOrderPayment = async () => {
    if (!selectedProvider) {
      alert('Please select a payment provider');
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/payments/order-payment/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: params.id,
          provider: selectedProvider,
          return_url: window.location.href,
          cancel_url: window.location.href
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.payment_url) {
          window.open(result.payment_url, '_blank');
        }
        setShowPaymentModal(false);
        // Refresh order details to show payment status
        await fetchOrderDetails();
      } else {
        const error = await response.json();
        alert(`Payment creation failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'delivered':
      case 'active':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'returned':
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
      case 'overdue':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'delivered':
      case 'active':
        return <Package className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'cancelled':
        return <X className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const calculateRentalDays = () => {
    if (!order) return 0;
    const start = new Date(order.rental_start_date);
    const end = new Date(order.rental_end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchPaymentProviders();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <RetailerNavbar />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-neutral-400">Loading order details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <RetailerNavbar />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Order Not Found</h1>
            <button
              onClick={() => router.push('/retailer/orders')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/retailer/orders')}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Order Details</h1>
              <p className="text-neutral-400 mt-1">{order.order_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(order.status || 'pending')}`}>
              {getStatusIcon(order.status || 'pending')}
              {order.status || 'Pending'}
            </span>
            {order.payment_status !== 'paid' && (order.total_amount || 0) > 0 && (
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Make Payment
              </button>
            )}
            <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-400">Order Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Rental Period</p>
                  <p className="font-medium">{calculateRentalDays()} days</p>
                </div>
                <div>
                  <p className="text-neutral-400">Payment Status</p>
                  <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Total Items</p>
                  <p className="font-medium">{order.items?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Rental Items */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Rental Items</h2>
              <div className="space-y-4">
                {order.items?.length ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{item.product_name}</h3>
                          <p className="text-neutral-400">Quantity: {item.quantity}</p>
                          <p className="text-neutral-400">Daily Rate: ₹{item.daily_rate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{item.total_amount}</p>
                        <p className="text-neutral-400 text-sm">
                          ₹{item.daily_rate} × {item.quantity} × {calculateRentalDays()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    No items found in this order
                  </div>
                )}
              </div>
            </div>

            {/* Order Actions */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Order Actions</h2>
              <div className="flex flex-wrap gap-3">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus('confirmed')}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus('cancelled')}
                      disabled={updating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus('returned')}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Mark as Returned
                  </button>
                )}
                <button
                  onClick={() => router.push(`/retailer/orders/${order.id}/edit`)}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Order
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-neutral-400 text-sm">Name</p>
                  <p className="font-medium">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {order.customer.email}
                  </p>
                </div>
                {order.customer.phone && (
                  <div>
                    <p className="text-neutral-400 text-sm">Phone</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {order.customer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            {order.delivery_address && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </h2>
                <div className="space-y-2 text-sm">
                  <p>{order.delivery_address.street}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.state}</p>
                  <p>{order.delivery_address.pincode}</p>
                </div>
              </div>
            )}

            {/* Rental Timeline */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rental Timeline
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-neutral-400 text-sm">Start Date</p>
                  <p className="font-medium">{new Date(order.rental_start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">End Date</p>
                  <p className="font-medium">{new Date(order.rental_end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Duration</p>
                  <p className="font-medium">{calculateRentalDays()} days</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Subtotal</span>
                  <span>₹{((order.total_amount || 0) - (order.deposit_amount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Security Deposit</span>
                  <span>₹{(order.deposit_amount || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-neutral-400 text-sm">Payment Status</p>
                  <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                  </p>
                </div>
                {order.payment_method && (
                  <div>
                    <p className="text-neutral-400 text-sm">Payment Method</p>
                    <p className="font-medium">{order.payment_method}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Select Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400 text-sm mb-2">Payment Amount</p>
                <p className="text-2xl font-bold text-green-400">₹{(order.total_amount || 0).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-neutral-400 text-sm mb-3">Choose Payment Provider</p>
                <div className="space-y-2">
                  {Array.isArray(paymentProviders) && paymentProviders.length > 0 ? (
                    paymentProviders.map((provider) => (
                      <label key={provider.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="payment-provider"
                          value={provider.id}
                          checked={selectedProvider === provider.id}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{provider.name}</span>
                          {provider.is_active && (
                            <span className="text-xs bg-green-600 text-green-100 px-2 py-1 rounded">Active</span>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-neutral-400 text-sm">
                      {paymentProviders === null || paymentProviders === undefined ? 
                        'Loading payment providers...' : 
                        'No payment providers available'
                      }
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-600 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createOrderPayment}
                  disabled={!selectedProvider || paymentLoading || !Array.isArray(paymentProviders) || paymentProviders.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? 'Processing...' : 
                   !Array.isArray(paymentProviders) || paymentProviders.length === 0 ? 'No Providers Available' :
                   'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
