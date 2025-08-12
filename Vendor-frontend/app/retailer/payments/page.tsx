"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, DollarSign, Calendar, CheckCircle, Clock, 
  X, Eye, Download, Filter, Search, Plus, Receipt 
} from 'lucide-react';
import { Navbar as RetailerNavbar } from '../../../components/retailer/Navbar';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';

interface Payment {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  payment_method: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'cash' | 'bank_transfer';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_type: 'rental_fee' | 'security_deposit' | 'late_fee' | 'damage_fee' | 'refund';
  amount: number;
  currency: string;
  transaction_id?: string;
  gateway_response?: string;
  due_date?: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
}

const PaymentsPage = () => {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_payments: 0,
    completed_payments: 0,
    pending_payments: 0,
    total_amount: 0,
    completed_amount: 0,
    pending_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [filter, typeFilter, currentPage, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/payments/payments/?page=${currentPage}`;
      
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.results || data);
        if (data.count) {
          setTotalPages(Math.ceil(data.count / 20));
        }
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/payments/statistics/`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const updatePaymentStatus = async (paymentId: number, newStatus: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/payments/payments/${paymentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (response.ok) {
        await fetchPayments();
        await fetchPaymentStats();
        alert(`Payment status updated to ${newStatus}`);
      } else {
        alert('Failed to update payment status');
      }
    } catch (error) {
      alert('Error updating payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'processing':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'refunded':
        return 'bg-purple-900/30 text-purple-400 border-purple-700';
      case 'cancelled':
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <CreditCard className="h-4 w-4" />;
      case 'failed':
        return <X className="h-4 w-4" />;
      case 'refunded':
        return <Receipt className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'rental_fee':
        return 'bg-blue-100 text-blue-800';
      case 'security_deposit':
        return 'bg-green-100 text-green-800';
      case 'late_fee':
        return 'bg-orange-100 text-orange-800';
      case 'damage_fee':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter !== 'all' && payment.payment_status !== filter) return false;
    if (typeFilter !== 'all' && payment.payment_type !== typeFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.order_id.toLowerCase().includes(searchLower) ||
        payment.customer_name.toLowerCase().includes(searchLower) ||
        payment.transaction_id?.toLowerCase().includes(searchLower)
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
            <h1 className="text-3xl font-bold text-white">Payment Management</h1>
            <p className="text-neutral-400 mt-1">Track and manage all payments and transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/retailer/payments/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Total Payments</p>
                <p className="text-xl font-bold">{stats.total_payments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Completed</p>
                <p className="text-xl font-bold">{stats.completed_payments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Pending</p>
                <p className="text-xl font-bold">{stats.pending_payments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Total Amount</p>
                <p className="text-xl font-bold">₹{stats.total_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Collected</p>
                <p className="text-xl font-bold">₹{stats.completed_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm">Outstanding</p>
                <p className="text-xl font-bold">₹{stats.pending_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <label className="text-neutral-300 text-sm font-medium">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-neutral-300 text-sm font-medium">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Types</option>
                  <option value="rental_fee">Rental Fee</option>
                  <option value="security_deposit">Security Deposit</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="damage_fee">Damage Fee</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search payments, orders, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">
              Payments ({filteredPayments.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-neutral-400">Loading payments...</div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-400 mb-4">
                {searchTerm || filter !== 'all' || typeFilter !== 'all' 
                  ? 'No payments match your criteria.' 
                  : 'No payments recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-white">
                          {payment.order_id}
                        </h3>
                        <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${getStatusColor(payment.payment_status)}`}>
                          {getStatusIcon(payment.payment_status)}
                          {payment.payment_status}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${getTypeColor(payment.payment_type)}`}>
                          {payment.payment_type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-400">
                        <div>
                          <span className="font-medium">Customer:</span>
                          <p>{payment.customer_name}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Payment Method:</span>
                          <p>{payment.payment_method.replace('_', ' ')}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Created:</span>
                          <p>{new Date(payment.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {payment.paid_date && (
                          <div>
                            <span className="font-medium">Paid:</span>
                            <p>{new Date(payment.paid_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {payment.transaction_id && (
                        <div className="text-sm text-neutral-400">
                          <span className="font-medium">Transaction ID:</span> {payment.transaction_id}
                        </div>
                      )}
                      
                      {payment.due_date && payment.payment_status === 'pending' && (
                        <div className="text-sm text-neutral-400">
                          <span className="font-medium">Due Date:</span> {new Date(payment.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right space-y-3 ml-6">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-neutral-400">{payment.currency}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </button>
                        
                        {payment.payment_status === 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus(payment.id, 'completed')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Paid
                          </button>
                        )}
                        
                        <button
                          onClick={() => window.open(`/api/payments/${payment.id}/receipt`, '_blank')}
                          className="flex items-center gap-1 px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Receipt
                        </button>
                      </div>
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

        {/* Payment Details Modal */}
        {showDetailsModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 rounded-lg max-w-2xl w-full p-6 border border-neutral-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Payment Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm">Order ID</p>
                    <p className="font-medium">{selectedPayment.order_id}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-sm">Customer</p>
                    <p className="font-medium">{selectedPayment.customer_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm">Amount</p>
                    <p className="font-medium text-xl">₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-sm">Payment Type</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${getTypeColor(selectedPayment.payment_type)}`}>
                      {selectedPayment.payment_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getStatusColor(selectedPayment.payment_status)}`}>
                      {getStatusIcon(selectedPayment.payment_status)}
                      {selectedPayment.payment_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-sm">Payment Method</p>
                    <p className="font-medium">{selectedPayment.payment_method.replace('_', ' ')}</p>
                  </div>
                </div>

                {selectedPayment.transaction_id && (
                  <div>
                    <p className="text-neutral-400 text-sm">Transaction ID</p>
                    <p className="font-medium font-mono">{selectedPayment.transaction_id}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm">Created Date</p>
                    <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                  </div>
                  {selectedPayment.paid_date && (
                    <div>
                      <p className="text-neutral-400 text-sm">Paid Date</p>
                      <p className="font-medium">{new Date(selectedPayment.paid_date).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedPayment.due_date && (
                  <div>
                    <p className="text-neutral-400 text-sm">Due Date</p>
                    <p className="font-medium">{new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedPayment.gateway_response && (
                  <div>
                    <p className="text-neutral-400 text-sm">Gateway Response</p>
                    <p className="font-medium text-sm">{selectedPayment.gateway_response}</p>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div>
                    <p className="text-neutral-400 text-sm">Notes</p>
                    <p className="font-medium">{selectedPayment.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {selectedPayment.payment_status === 'pending' && (
                    <button
                      onClick={() => {
                        updatePaymentStatus(selectedPayment.id, 'completed');
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`/api/payments/${selectedPayment.id}/receipt`, '_blank')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
