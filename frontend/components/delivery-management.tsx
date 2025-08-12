"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, CalendarIcon, Truck, Package, MapPin, Clock, CheckCircle, ArrowRight, Phone, Mail } from "lucide-react"
import { format } from "date-fns"

// Hardcoded delivery data
const deliveries = [
  {
    id: "DEL-001",
    orderId: "RO-001",
    customer: "John Smith",
    address: "123 Main St, New York, NY 10001",
    phone: "+1 234-567-8901",
    email: "john@example.com",
    products: [{ name: "Professional Camera Kit", quantity: 1 }],
    type: "pickup",
    scheduledDate: "2024-01-15",
    scheduledTime: "10:00 AM",
    status: "scheduled",
    driver: "Mike Johnson",
    notes: "Customer prefers morning delivery",
  },
  {
    id: "DEL-002",
    orderId: "RO-002",
    customer: "Sarah Johnson",
    address: "456 Oak Ave, Brooklyn, NY 11201",
    phone: "+1 234-567-8902",
    email: "sarah@example.com",
    products: [
      { name: "Sound System Package", quantity: 1 },
      { name: "Lighting Equipment Set", quantity: 1 },
    ],
    type: "pickup",
    scheduledDate: "2024-01-20",
    scheduledTime: "2:00 PM",
    status: "in-transit",
    driver: "Tom Wilson",
    notes: "Large items - use freight elevator",
  },
  {
    id: "DEL-003",
    orderId: "RO-003",
    customer: "Mike Wilson",
    address: "789 Pine St, Queens, NY 11375",
    phone: "+1 234-567-8903",
    email: "mike@example.com",
    products: [{ name: "Video Editing Workstation", quantity: 1 }],
    type: "return",
    scheduledDate: "2024-02-01",
    scheduledTime: "11:00 AM",
    status: "completed",
    driver: "Mike Johnson",
    notes: "Equipment returned in good condition",
  },
]

const stockMovements = [
  {
    id: "SM-001",
    orderId: "RO-001",
    product: "Professional Camera Kit",
    type: "reservation",
    quantity: 1,
    from: "Available Stock",
    to: "Reserved",
    timestamp: "2024-01-10 09:30 AM",
    status: "completed",
  },
  {
    id: "SM-002",
    orderId: "RO-002",
    product: "Sound System Package",
    type: "pickup",
    quantity: 1,
    from: "Reserved",
    to: "With Customer",
    timestamp: "2024-01-20 02:15 PM",
    status: "completed",
  },
  {
    id: "SM-003",
    orderId: "RO-003",
    product: "Video Editing Workstation",
    type: "return",
    quantity: 1,
    from: "With Customer",
    to: "Available Stock",
    timestamp: "2024-02-01 11:30 AM",
    status: "completed",
  },
]

export function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary"
      case "in-transit":
        return "default"
      case "completed":
        return "outline"
      case "delayed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pickup":
        return "default"
      case "return":
        return "secondary"
      default:
        return "outline"
    }
  }

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    const matchesType = typeFilter === "all" || delivery.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Management</h1>
          <p className="text-muted-foreground">Track pickups, deliveries, and returns</p>
        </div>
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Truck className="h-4 w-4 mr-2" />
              Schedule Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Delivery</DialogTitle>
              <DialogDescription>Schedule a pickup or return for a rental order</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order ID</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RO-001">RO-001 - John Smith</SelectItem>
                    <SelectItem value="RO-002">RO-002 - Sarah Johnson</SelectItem>
                    <SelectItem value="RO-003">RO-003 - Mike Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup (Delivery to Customer)</SelectItem>
                    <SelectItem value="return">Return (Collect from Customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Select date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Time</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign Driver</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mike">Mike Johnson</SelectItem>
                    <SelectItem value="tom">Tom Wilson</SelectItem>
                    <SelectItem value="sarah">Sarah Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Delivery Notes</Label>
                <Textarea placeholder="Special instructions or notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowScheduleDialog(false)}>Schedule Delivery</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="deliveries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="stock-movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="routes">Route Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search deliveries..."
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{delivery.id}</CardTitle>
                      <CardDescription>Order: {delivery.orderId}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getTypeColor(delivery.type)}>{delivery.type}</Badge>
                      <Badge variant={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{delivery.customer}</p>
                        <p className="text-sm text-muted-foreground">{delivery.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(delivery.scheduledDate), "MMM dd, yyyy")} at {delivery.scheduledTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Driver: {delivery.driver}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Products:</p>
                      {delivery.products.map((product, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {product.quantity}x {product.name}
                        </p>
                      ))}
                    </div>
                    {delivery.notes && <p className="text-sm text-muted-foreground italic">{delivery.notes}</p>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Delivery Table */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Schedule</CardTitle>
              <CardDescription>Complete delivery tracking table</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.id}</TableCell>
                      <TableCell>{delivery.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delivery.customer}</p>
                          <p className="text-sm text-muted-foreground">{delivery.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(delivery.type)}>{delivery.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(delivery.scheduledDate), "MMM dd")}</p>
                          <p className="text-muted-foreground">{delivery.scheduledTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>{delivery.driver}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Track
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

        <TabsContent value="stock-movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Tracking</CardTitle>
              <CardDescription>Track product movements through reservation, pickup, and return stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stock Movement Flow Diagram */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Stock Movement Flow</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">Available Stock</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <p className="text-sm font-medium">Reserved</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Truck className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm font-medium">With Customer</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">Returned</p>
                    </div>
                  </div>
                </div>

                {/* Stock Movements Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Movement ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Movement</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">{movement.id}</TableCell>
                        <TableCell>{movement.orderId}</TableCell>
                        <TableCell>{movement.product}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.type === "reservation"
                                ? "secondary"
                                : movement.type === "pickup"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{movement.from}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{movement.to}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{movement.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Planning</CardTitle>
              <CardDescription>Optimize delivery routes and driver assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Route planning and optimization coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Features will include GPS tracking, route optimization, and real-time updates
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery Details Dialog */}
      {selectedDelivery && (
        <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Delivery Details - {selectedDelivery.id}</DialogTitle>
              <DialogDescription>Complete delivery information and tracking</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedDelivery.customer}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedDelivery.phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedDelivery.email}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedDelivery.address}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Schedule</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Date:</strong> {format(new Date(selectedDelivery.scheduledDate), "PPP")}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedDelivery.scheduledTime}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedDelivery.type}
                    </p>
                    <p>
                      <strong>Driver:</strong> {selectedDelivery.driver}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Products</h3>
                  <div className="space-y-2">
                    {selectedDelivery.products.map((product: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {product.quantity}x {product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status & Notes</h3>
                  <div className="space-y-2">
                    <Badge variant={getStatusColor(selectedDelivery.status)}>{selectedDelivery.status}</Badge>
                    {selectedDelivery.notes && (
                      <p className="text-sm text-muted-foreground">{selectedDelivery.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                View Route
              </Button>
              <Button>Update Status</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
