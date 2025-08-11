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
import { 
  Package, 
  Search, 
  CalendarIcon, 
  FileText, 
  Download, 
  Eye, 
  RefreshCw,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Calendar as CalendarSchedule
} from "lucide-react"
import { format, subDays, subMonths } from "date-fns"

// Mock order history data
const orderHistory = [
  {
    id: "RO-2024-001",
    orderNumber: "RO-001",
    date: "2024-08-01",
    status: "completed",
    items: [
      { name: "Professional Camera Kit", quantity: 1, pricePerDay: 75, days: 3 }
    ],
    totalAmount: 225,
    paidAmount: 225,
    paymentStatus: "paid",
    rentalPeriod: {
      start: "2024-08-01",
      end: "2024-08-04"
    },
    pickupLocation: "Downtown Store",
    returnDate: "2024-08-04",
    rating: 5,
    hasReview: true
  },
  {
    id: "RO-2024-002",
    orderNumber: "RO-002",
    date: "2024-07-15",
    status: "completed",
    items: [
      { name: "Sound System Package", quantity: 1, pricePerDay: 120, days: 2 },
      { name: "Lighting Equipment Set", quantity: 1, pricePerDay: 90, days: 2 }
    ],
    totalAmount: 420,
    paidAmount: 420,
    paymentStatus: "paid",
    rentalPeriod: {
      start: "2024-07-15",
      end: "2024-07-17"
    },
    pickupLocation: "Main Warehouse",
    returnDate: "2024-07-17",
    rating: 4,
    hasReview: true
  },
  {
    id: "RO-2024-003",
    orderNumber: "RO-003",
    date: "2024-07-01",
    status: "active",
    items: [
      { name: "Video Editing Workstation", quantity: 1, pricePerDay: 350, days: 7 }
    ],
    totalAmount: 2450,
    paidAmount: 1225,
    paymentStatus: "partial",
    rentalPeriod: {
      start: "2024-07-01",
      end: "2024-07-08"
    },
    pickupLocation: "Tech Center",
    returnDate: null,
    rating: null,
    hasReview: false
  },
  {
    id: "RO-2024-004",
    orderNumber: "RO-004",
    date: "2024-06-20",
    status: "cancelled",
    items: [
      { name: "Drone Kit with Gimbal", quantity: 1, pricePerDay: 200, days: 1 }
    ],
    totalAmount: 200,
    paidAmount: 0,
    paymentStatus: "refunded",
    rentalPeriod: {
      start: "2024-06-22",
      end: "2024-06-23"
    },
    pickupLocation: "Downtown Store",
    returnDate: null,
    rating: null,
    hasReview: false
  },
  {
    id: "RO-2024-005",
    orderNumber: "RO-005",
    date: "2024-06-10",
    status: "completed",
    items: [
      { name: "DJ Equipment Package", quantity: 1, pricePerDay: 180, days: 1 },
      { name: "Speaker System", quantity: 2, pricePerDay: 50, days: 1 }
    ],
    totalAmount: 280,
    paidAmount: 280,
    paymentStatus: "paid",
    rentalPeriod: {
      start: "2024-06-12",
      end: "2024-06-13"
    },
    pickupLocation: "Music Store",
    returnDate: "2024-06-13",
    rating: 5,
    hasReview: true
  }
]

export function CustomerOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filter orders based on search and filters
  const filteredOrders = orderHistory.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    let matchesDate = true
    if (dateRange !== "all") {
      const orderDate = new Date(order.date)
      const now = new Date()
      
      switch (dateRange) {
        case "week":
          matchesDate = orderDate >= subDays(now, 7)
          break
        case "month":
          matchesDate = orderDate >= subMonths(now, 1)
          break
        case "quarter":
          matchesDate = orderDate >= subMonths(now, 3)
          break
        case "year":
          matchesDate = orderDate >= subMonths(now, 12)
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "active":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "active":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
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
      case "refunded":
        return "outline"
      default:
        return "outline"
    }
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground">View and manage your rental order history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderHistory.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {orderHistory.filter(o => o.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rentals</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orderHistory.filter(o => o.status === "active").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${orderHistory.reduce((sum, order) => sum + order.paidAmount, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders or items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} of {orderHistory.length} orders shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Rental Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{format(new Date(order.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <p key={index} className="text-sm">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(order.rentalPeriod.start), "MMM dd")}</p>
                      <p className="text-muted-foreground">
                        to {format(new Date(order.rentalPeriod.end), "MMM dd")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${order.totalAmount}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid: ${order.paidAmount}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderStars(order.rating)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === "completed" && !order.hasReview && (
                        <Button variant="ghost" size="sm">
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === "active" && (
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                Order placed on {format(new Date(selectedOrder.date), "MMMM dd, yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number:</span>
                      <span className="font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{format(new Date(selectedOrder.date), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pickup Location:</span>
                      <span>{selectedOrder.pickupLocation}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Rental Period</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{format(new Date(selectedOrder.rentalPeriod.start), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{format(new Date(selectedOrder.rentalPeriod.end), "MMM dd, yyyy")}</span>
                    </div>
                    {selectedOrder.returnDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Returned:</span>
                        <span>{format(new Date(selectedOrder.returnDate), "MMM dd, yyyy")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.rating && (
                  <div>
                    <h3 className="font-semibold mb-2">Your Rating</h3>
                    {renderStars(selectedOrder.rating)}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Rental Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.pricePerDay}/day × {item.days} days × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium">
                          ${item.pricePerDay * item.days * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>$0</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total:</span>
                      <span>${selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="text-green-600">${selectedOrder.paidAmount}</span>
                    </div>
                    {selectedOrder.paidAmount < selectedOrder.totalAmount && (
                      <div className="flex justify-between">
                        <span>Balance Due:</span>
                        <span className="text-red-600">
                          ${selectedOrder.totalAmount - selectedOrder.paidAmount}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <Badge variant={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              {selectedOrder.status === "completed" && !selectedOrder.hasReview && (
                <Button>
                  <Star className="h-4 w-4 mr-2" />
                  Write Review
                </Button>
              )}
              {selectedOrder.status === "active" && (
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Extend Rental
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
