"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, CalendarIcon, FileText, CreditCard, Truck, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useOrders } from "@/hooks/use-api"
import { toast } from "sonner"

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<"main" | "create-quotation" | "view" | "edit">("main")
  
  // Use our API hooks
  const { orders, loading, error, fetchOrders, createOrder } = useOrders()
  
  // Show error toast if there's an API error
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])
  
  // Mock quotations data for now (until we implement quotes API)
  const [quotations] = useState([
    {
      id: "Q-001",
      customer: "John Smith Photography",
      email: "john@smithphoto.com",
      products: [
        { name: "Professional Camera Kit", quantity: 2, price: 250 }
      ],
      totalAmount: 500,
      validUntil: "2024-02-15",
      status: "sent"
    }
  ])

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
  
  // Form state for creating orders
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    email: "",
    phone: "",
    products: [] as any[],
    startDate: null as Date | null,
    endDate: null as Date | null,
    paymentTerms: ""
  })


  const handleCreateOrder = async () => {
    if (newOrder.customerName && newOrder.email && newOrder.products.length > 0) {
      try {
        const orderData = {
          customerId: "temp-customer-id", // This should be from customer selection
          items: newOrder.products.map(p => ({
            productId: p.id,
            quantity: p.quantity,
            unitPrice: p.price,
            startDate: newOrder.startDate?.toISOString() || "",
            endDate: newOrder.endDate?.toISOString() || ""
          })),
          startDate: newOrder.startDate?.toISOString() || "",
          endDate: newOrder.endDate?.toISOString() || "",
          notes: `Customer: ${newOrder.customerName}, Email: ${newOrder.email}, Phone: ${newOrder.phone}`
        }
        
        const result = await createOrder(orderData)
        if (result.success) {
          toast.success("Order created successfully!")
          setNewOrder({
            customerName: "",
            email: "",
            phone: "",
            products: [],
            startDate: null,
            endDate: null,
            paymentTerms: ""
          })
          setShowCreateOrder(false)
        } else {
          toast.error(result.error || "Failed to create order")
        }
      } catch (error) {
        toast.error("Failed to create order")
      }
    } else {
      toast.error("Please fill in all required fields")
    }
  }

  const handleCreateQuotation = () => {
    setCurrentPage("create-quotation")
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setCurrentPage("view")
  }

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order)
    setCurrentPage("edit")
  }

  const handleBackToMain = () => {
    setCurrentPage("main")
    setSelectedOrder(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "reserved":
        return "secondary"
      case "pickup":
        return "secondary"
      case "active":
        return "default"
      case "returned":
        return "outline"
      case "cancelled":
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
                    <Input 
                      placeholder="Customer Name" 
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                    <Input 
                      placeholder="Email" 
                      type="email" 
                      value={newOrder.email}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input 
                      placeholder="Phone" 
                      value={newOrder.phone}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rental Period</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {newOrder.startDate ? format(newOrder.startDate, "MMM dd") : "Start Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar 
                            mode="single" 
                            selected={newOrder.startDate || undefined}
                            onSelect={(date) => setNewOrder(prev => ({ ...prev, startDate: date || null }))}
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {newOrder.endDate ? format(newOrder.endDate, "MMM dd") : "End Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar 
                            mode="single" 
                            selected={newOrder.endDate || undefined}
                            onSelect={(date) => setNewOrder(prev => ({ ...prev, endDate: date || null }))}
                            initialFocus 
                          />
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
                    <Select 
                      value={newOrder.paymentTerms} 
                      onValueChange={(value) => setNewOrder(prev => ({ ...prev, paymentTerms: value }))}
                    >
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
                <Button onClick={handleCreateOrder}>Create Order</Button>
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
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">No orders found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerId}</p>
                            <p className="text-sm text-muted-foreground">Customer ID: {order.customerId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <p key={index} className="text-sm">
                                {item.quantity}x {item.productName}
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
                          <Badge variant={order.remainingAmount > 0 ? "destructive" : "default"}>
                            {order.remainingAmount > 0 ? "pending" : "paid"}
                          </Badge>
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
                    ))
                  )}
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
              <DialogTitle>Order Details - {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>Complete order information and management options</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Customer ID:</strong> {selectedOrder.customerId}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedOrder.status}
                    </p>
                    {selectedOrder.notes && (
                      <p>
                        <strong>Notes:</strong> {selectedOrder.notes}
                      </p>
                    )}
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
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>${item.totalPrice}</span>
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
                      <span>${selectedOrder.remainingAmount}</span>
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
