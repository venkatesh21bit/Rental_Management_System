"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Search, CalendarIcon, FileText, CreditCard, Truck } from "lucide-react"
import { format } from "date-fns"

// Hardcoded order data
const orders = [
  {
    id: "RO-001",
    customer: "John Smith",
    email: "john@example.com",
    phone: "+1 234-567-8901",
    products: [{ name: "Professional Camera Kit", quantity: 1, price: 75, duration: "3 days" }],
    startDate: "2024-01-15",
    endDate: "2024-01-18",
    status: "confirmed",
    totalAmount: 225,
    paidAmount: 225,
    paymentStatus: "paid",
    deliveryStatus: "pending",
    createdAt: "2024-01-10",
  },
  {
    id: "RO-002",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 234-567-8902",
    products: [
      { name: "Sound System Package", quantity: 1, price: 120, duration: "2 days" },
      { name: "Lighting Equipment Set", quantity: 1, price: 90, duration: "2 days" },
    ],
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    status: "pickup",
    totalAmount: 420,
    paidAmount: 200,
    paymentStatus: "partial",
    deliveryStatus: "ready",
    createdAt: "2024-01-12",
  },
  {
    id: "RO-003",
    customer: "Mike Wilson",
    email: "mike@example.com",
    phone: "+1 234-567-8903",
    products: [{ name: "Video Editing Workstation", quantity: 1, price: 350, duration: "1 week" }],
    startDate: "2024-01-25",
    endDate: "2024-02-01",
    status: "active",
    totalAmount: 350,
    paidAmount: 350,
    paymentStatus: "paid",
    deliveryStatus: "delivered",
    createdAt: "2024-01-18",
  },
]

const quotations = [
  {
    id: "RQ-001",
    customer: "Emma Davis",
    email: "emma@example.com",
    products: [{ name: "Professional Camera Kit", quantity: 2, price: 75, duration: "5 days" }],
    totalAmount: 750,
    validUntil: "2024-02-15",
    status: "pending",
    createdAt: "2024-01-20",
  },
  {
    id: "RQ-002",
    customer: "David Brown",
    email: "david@example.com",
    products: [
      { name: "Sound System Package", quantity: 1, price: 120, duration: "3 days" },
      { name: "Lighting Equipment Set", quantity: 2, price: 90, duration: "3 days" },
    ],
    totalAmount: 900,
    validUntil: "2024-02-20",
    status: "approved",
    createdAt: "2024-01-22",
  },
]

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pickup":
        return "secondary"
      case "active":
        return "default"
      case "returned":
        return "outline"
      case "overdue":
        return "destructive"
      case "pending":
        return "secondary"
      case "approved":
        return "default"
      default:
        return "outline"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Manage rental quotations, orders, and contracts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
          <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Rental Order</DialogTitle>
                <DialogDescription>Create a new rental order for a customer</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer Information</Label>
                    <Input placeholder="Customer Name" />
                    <Input placeholder="Email" type="email" />
                    <Input placeholder="Phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rental Period</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Start Date
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" initialFocus />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            End Date
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Products</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Professional Camera Kit</SelectItem>
                        <SelectItem value="sound">Sound System Package</SelectItem>
                        <SelectItem value="lighting">Lighting Equipment Set</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Selected products will appear here</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Payment Upfront</SelectItem>
                        <SelectItem value="deposit">50% Deposit</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateOrder(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateOrder(false)}>Create Order</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Order Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Orders</CardTitle>
              <CardDescription>All rental orders and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Rental Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-muted-foreground">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.products.map((product, index) => (
                            <p key={index} className="text-sm">
                              {product.quantity}x {product.name}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(order.startDate), "MMM dd")}</p>
                          <p className="text-muted-foreground">to {format(new Date(order.endDate), "MMM dd")}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">${order.totalAmount}</p>
                          <p className="text-sm text-muted-foreground">Paid: ${order.paidAmount}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Quotations</CardTitle>
              <CardDescription>Manage customer quotations and convert to orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.customer}</p>
                          <p className="text-sm text-muted-foreground">{quote.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {quote.products.map((product, index) => (
                            <p key={index} className="text-sm">
                              {product.quantity}x {product.name}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${quote.totalAmount}</TableCell>
                      <TableCell>{format(new Date(quote.validUntil), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(quote.status)}>{quote.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            Convert
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Contracts</CardTitle>
              <CardDescription>Generated contracts for confirmed orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Contract management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.id}</DialogTitle>
              <DialogDescription>Complete order information and management options</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedOrder.customer}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedOrder.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Rental Period</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Start:</strong> {format(new Date(selectedOrder.startDate), "PPP")}
                    </p>
                    <p>
                      <strong>End:</strong> {format(new Date(selectedOrder.endDate), "PPP")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Products</h3>
                  <div className="space-y-2">
                    {selectedOrder.products.map((product: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {product.quantity}x {product.name}
                        </span>
                        <span>${product.price * product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span>${selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span>${selectedOrder.paidAmount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Balance:</span>
                      <span>${selectedOrder.totalAmount - selectedOrder.paidAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Contract
              </Button>
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
              <Button>
                <Truck className="h-4 w-4 mr-2" />
                Schedule Pickup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
