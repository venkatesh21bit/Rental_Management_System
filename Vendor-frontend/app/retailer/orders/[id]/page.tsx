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
  status: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  deposit_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment_status: string;
  payment_method?: string;
  notes?: string;
}

const OrderDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
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
            <span className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              {order.status}
            </span>
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
                    {order.payment_status}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Total Items</p>
                  <p className="font-medium">{order.items.length}</p>
                </div>
              </div>
            </div>

            {/* Rental Items */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Rental Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
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
                ))}
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
                  <span>₹{(order.total_amount - order.deposit_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Security Deposit</span>
                  <span>₹{order.deposit_amount.toLocaleString()}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-neutral-400 text-sm">Payment Status</p>
                  <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.payment_status.toUpperCase()}
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
    </div>
  );
};

export default OrderDetailsPage;
