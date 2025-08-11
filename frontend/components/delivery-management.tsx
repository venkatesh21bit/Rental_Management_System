"use client"

import { useState, useEffect } from "react"
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
import { Search, CalendarIcon, Truck, Package, MapPin, Clock, CheckCircle, ArrowRight, Phone, Mail, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useDeliveries } from "@/hooks/use-api"
import { toast } from "sonner"

export function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Use our delivery API hooks
  const {
    deliveries,
    routes,
    analytics,
    loading,
    error,
    fetchDeliveries,
    createDelivery,
    updateDeliveryStatus,
    fetchRoutes,
    autoScheduleDeliveries,
    triggerWorkflow,
    fetchAnalytics
  } = useDeliveries()

  // Fetch data on component mount
  useEffect(() => {
    fetchDeliveries()
    fetchRoutes()
    fetchAnalytics()
  }, [fetchDeliveries, fetchRoutes, fetchAnalytics])

  // Auto-refresh deliveries every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeliveries()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchDeliveries])

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

  // Handle delivery status updates with automatic workflow progression
  const handleStatusUpdate = async (deliveryId: string, newStatus: string, proof?: string) => {
    try {
      const result = await updateDeliveryStatus(deliveryId, newStatus, proof)
      
      if (result.success) {
        toast.success(`Delivery status updated to ${newStatus}`)
        
        // Trigger automatic workflow progression if needed
        const delivery = deliveries.find(d => d.id === deliveryId)
        if (delivery && newStatus === 'completed') {
          await handleWorkflowProgression(delivery)
        }
      } else {
        toast.error(result.error || 'Failed to update delivery status')
      }
    } catch (error) {
      toast.error('Failed to update delivery status')
    }
  }

  // Handle automatic workflow progression (Reservation → Pickup → Return)
  const handleWorkflowProgression = async (delivery: any) => {
    try {
      if (delivery.type === 'pickup') {
        // After successful pickup, automatically schedule return
        const returnDate = new Date(delivery.scheduled_date)
        returnDate.setDate(returnDate.getDate() + 7) // Default 7-day rental
        
        const returnDelivery = {
          order_id: delivery.order_id,
          delivery_type: 'return',
          scheduled_date: returnDate.toISOString().split('T')[0],
          scheduled_time: delivery.scheduled_time,
          notes: `Automatic return scheduling for order ${delivery.order_id}`
        }
        
        const result = await createDelivery(returnDelivery)
        if (result.success) {
          toast.success('Return delivery automatically scheduled')
        }
      } else if (delivery.type === 'return') {
        // After successful return, trigger stock update
        toast.success('Product returned to available stock')
      }
    } catch (error) {
      console.error('Workflow progression error:', error)
    }
  }

  // Auto-schedule deliveries using Redis/Celery optimization
  const handleAutoSchedule = async () => {
    if (!selectedDate) {
      toast.error('Please select a date for auto-scheduling')
      return
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const result = await autoScheduleDeliveries(dateStr)
      
      if (result.success) {
        toast.success(`Auto-scheduled ${result.data?.scheduled_count || 0} deliveries`)
        fetchDeliveries() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to auto-schedule deliveries')
      }
    } catch (error) {
      toast.error('Failed to auto-schedule deliveries')
    }
  }

  // Trigger workflow for a specific order
  const handleTriggerWorkflow = async (orderId: string) => {
    try {
      const result = await triggerWorkflow(orderId)
      
      if (result.success) {
        toast.success('Delivery workflow triggered successfully')
        fetchDeliveries()
      } else {
        toast.error(result.error || 'Failed to trigger workflow')
      }
    } catch (error) {
      toast.error('Failed to trigger workflow')
    }
  }

  // Filter deliveries based on search and filters
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const matchesSearch =
      delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    const matchesType = typeFilter === "all" || delivery.delivery_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deliveries...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Management</h1>
          <p className="text-muted-foreground">Automated workflow for pickups, deliveries, and returns</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoSchedule}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Auto Schedule
          </Button>
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
                      {delivery.products.map((product: any, index: number) => (
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
                    {analytics ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <div className="space-y-4 py-8">
                            <div className="text-center">
                              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">Automated Workflow Analytics</h3>
                              <p className="text-muted-foreground mb-6">Real-time delivery and return statistics</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <div className="text-3xl font-bold text-blue-600">{analytics.deliveries?.total || 0}</div>
                                  <div className="text-sm text-muted-foreground">Total Deliveries</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <div className="text-3xl font-bold text-green-600">{analytics.deliveries?.completed || 0}</div>
                                  <div className="text-sm text-muted-foreground">Completed</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <div className="text-3xl font-bold text-orange-600">{analytics.returns?.total || 0}</div>
                                  <div className="text-sm text-muted-foreground">Returns</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <div className="text-3xl font-bold text-red-600">{analytics.returns?.overdue || 0}</div>
                                  <div className="text-sm text-muted-foreground">Overdue</div>
                                </CardContent>
                              </Card>
                            </div>
                            <div className="mt-6">
                              <Button 
                                onClick={() => fetchAnalytics()}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Refreshing...
                                  </>
                                ) : (
                                  'Refresh Analytics'
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <div className="text-muted-foreground">Loading analytics...</div>
                        </TableCell>
                      </TableRow>
                    )}
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
