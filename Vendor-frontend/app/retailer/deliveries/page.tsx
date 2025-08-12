"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Truck, MapPin, Clock, CheckCircle, Package, Calendar,
  Phone, Mail, User, Navigation, Edit, Eye 
} from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface Delivery {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email: string;
  delivery_address: DeliveryAddress;
  delivery_date: string;
  delivery_time_slot: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  driver_name?: string;
  driver_phone?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const DeliveryPage = () => {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [filter, currentPage, searchTerm]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/deliveries/deliveries/?page=${currentPage}`;
      
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.results || data);
        if (data.count) {
          setTotalPages(Math.ceil(data.count / 20));
        }
      } else {
        console.error('Failed to fetch deliveries');
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: number, newStatus: string, notes?: string) => {
    try {
      setUpdating(true);
      const response = await fetchWithAuth(`${API_URL}/deliveries/deliveries/${deliveryId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          notes: notes || undefined 
        }),
      });

      if (response.ok) {
        await fetchDeliveries();
        setShowUpdateModal(false);
        setSelectedDelivery(null);
        alert(`Delivery status updated to ${newStatus}`);
      } else {
        alert('Failed to update delivery status');
      }
    } catch (error) {
      alert('Error updating delivery status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'in_transit':
        return 'bg-purple-900/30 text-purple-400 border-purple-700';
      case 'delivered':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'cancelled':
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter !== 'all' && delivery.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        delivery.order_id.toLowerCase().includes(searchLower) ||
        delivery.customer_name.toLowerCase().includes(searchLower) ||
        delivery.tracking_number?.toLowerCase().includes(searchLower) ||
        delivery.delivery_address.city.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Delivery Management</h1>
            <p className="text-neutral-400 mt-1">Track and manage all deliveries</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/retailer/deliveries/schedule')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Schedule Delivery
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-neutral-300 text-sm font-medium">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Deliveries</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search deliveries, orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">
              Deliveries ({filteredDeliveries.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-neutral-400">Loading deliveries...</div>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-8 text-center">
              <Truck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-400 mb-4">
                {searchTerm || filter !== 'all' ? 'No deliveries match your criteria.' : 'No deliveries scheduled yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-6 hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-white">
                          Order: {delivery.order_id}
                        </h3>
                        <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          {delivery.status.replace('_', ' ')}
                        </span>
                        {delivery.tracking_number && (
                          <span className="text-sm text-neutral-400">
                            Track: {delivery.tracking_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <User className="h-4 w-4" />
                          <span>{delivery.customer_name}</span>
                        </div>
                        
                        {delivery.customer_phone && (
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Phone className="h-4 w-4" />
                            <span>{delivery.customer_phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Mail className="h-4 w-4" />
                          <span>{delivery.customer_email}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2 text-neutral-400">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <div>
                            <p>{delivery.delivery_address.street}</p>
                            <p>{delivery.delivery_address.city}, {delivery.delivery_address.state} {delivery.delivery_address.pincode}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(delivery.delivery_date).toLocaleDateString()} 
                            {delivery.delivery_time_slot && ` at ${delivery.delivery_time_slot}`}
                          </span>
                        </div>
                      </div>
                      
                      {delivery.driver_name && (
                        <div className="flex items-center gap-4 text-sm text-neutral-400">
                          <span>Driver: {delivery.driver_name}</span>
                          {delivery.driver_phone && <span>Phone: {delivery.driver_phone}</span>}
                        </div>
                      )}
                      
                      {delivery.notes && (
                        <div className="text-sm text-neutral-400">
                          <span className="font-medium">Notes:</span> {delivery.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowUpdateModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Update
                      </button>
                      <button
                        onClick={() => router.push(`/retailer/deliveries/${delivery.id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </button>
                      <button
                        onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(
                          `${delivery.delivery_address.street}, ${delivery.delivery_address.city}, ${delivery.delivery_address.state} ${delivery.delivery_address.pincode}`
                        )}`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg disabled:opacity-50 hover:bg-neutral-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg disabled:opacity-50 hover:bg-neutral-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 rounded-lg max-w-md w-full p-6 border border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Update Delivery Status</h3>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-400">Order: {selectedDelivery.order_id}</p>
                  <p className="text-sm text-neutral-400">Customer: {selectedDelivery.customer_name}</p>
                  <p className="text-sm text-neutral-400">Current Status: {selectedDelivery.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateDeliveryStatus(selectedDelivery.id, status)}
                      disabled={updating || selectedDelivery.status === status}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        selectedDelivery.status === status
                          ? 'bg-neutral-700 text-neutral-400'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPage;
