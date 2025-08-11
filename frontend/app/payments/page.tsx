'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { AppNavigation } from '@/components/app-navigation';

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  payment_reference: string;
  order_id?: number;
  invoice_id?: number;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: number;
  type: 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'DIGITAL_WALLET';
  last_four: string;
  brand?: string;
  is_default: boolean;
  is_active: boolean;
  expires_at?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issue_date: string;
  due_date: string;
  payment_date?: string;
}

export default function PaymentsPage() {
  const { user, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    fetchPaymentData();
  }, [isAuthenticated]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockPayments: Payment[] = [
        {
          id: 1,
          amount: 450.00,
          currency: 'USD',
          status: 'COMPLETED',
          payment_method: 'Credit Card',
          payment_reference: 'pay_1234567890',
          order_id: 101,
          created_at: '2025-01-10T10:30:00Z',
          updated_at: '2025-01-10T10:31:00Z'
        },
        {
          id: 2,
          amount: 1200.00,
          currency: 'USD',
          status: 'PENDING',
          payment_method: 'Bank Transfer',
          payment_reference: 'pay_0987654321',
          order_id: 102,
          created_at: '2025-01-12T14:20:00Z',
          updated_at: '2025-01-12T14:20:00Z'
        }
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 1,
          type: 'CREDIT_CARD',
          last_four: '4242',
          brand: 'Visa',
          is_default: true,
          is_active: true,
          expires_at: '2028-12-31'
        },
        {
          id: 2,
          type: 'CREDIT_CARD',
          last_four: '1234',
          brand: 'Mastercard',
          is_default: false,
          is_active: true,
          expires_at: '2027-06-30'
        }
      ];

      const mockInvoices: Invoice[] = [
        {
          id: 1,
          invoice_number: 'INV-2025-001',
          amount: 450.00,
          status: 'PAID',
          issue_date: '2025-01-10T00:00:00Z',
          due_date: '2025-01-25T00:00:00Z',
          payment_date: '2025-01-10T10:30:00Z'
        },
        {
          id: 2,
          invoice_number: 'INV-2025-002',
          amount: 1200.00,
          status: 'SENT',
          issue_date: '2025-01-12T00:00:00Z',
          due_date: '2025-01-27T00:00:00Z'
        }
      ];

      setPayments(mockPayments);
      setPaymentMethods(mockPaymentMethods);
      setInvoices(mockInvoices);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payment information'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
      case 'SENT':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'default';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      case 'PENDING':
      case 'SENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments & Billing</h1>
            <p className="text-muted-foreground">Manage your payments, invoices, and billing information</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="billing">Billing Info</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Payment History
                    </CardTitle>
                    <CardDescription>
                      View all your payment transactions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_method} • Order #{payment.order_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>
                      Manage your saved payment methods
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {method.brand} •••• {method.last_four}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.type.replace('_', ' ')}
                            {method.expires_at && ` • Expires ${new Date(method.expires_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Invoices
                    </CardTitle>
                    <CardDescription>
                      View and download your invoices
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            ${invoice.amount.toFixed(2)} • Due {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued {new Date(invoice.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your billing address and tax information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Billing Address</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>123 Main St</p>
                        <p>New York, NY 10001</p>
                        <p>United States</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tax Information</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Tax ID: 12-3456789</p>
                        <p>Business Type: Corporation</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button variant="outline">
                      Edit Billing Information
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
