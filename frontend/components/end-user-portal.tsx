"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Search, 
  CalendarIcon, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Star, 
  Heart, 
  Clock, 
  CheckCircle,
  Eye,
  Download,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  DollarSign,
  Truck,
  AlertCircle,
  Filter,
  Settings,
  BarChart3,
  Users,
  Calendar as CalendarSchedule
} from "lucide-react"
import { format, addDays } from "date-fns"

// End User Portal Data - End User Interface
const endUserData = {
  stats: {
    totalCustomers: 1245,
    activeRentals: 89,
    totalRevenue: 156780,
    pendingReturns: 23,
    monthlyGrowth: 12.5,
    customerSatisfaction: 4.7
  },
  recentOrders: [
    {
      id: "RO-2024-045",
      customer: "Alice Johnson",
      product: "Professional Camera Kit",
      startDate: "2024-08-15",
      endDate: "2024-08-18",
      status: "confirmed",
      amount: 375.00,
      priority: "normal"
    },
    {
      id: "RO-2024-046",
      customer: "Michael Brown",
      product: "Sound System Package",
      startDate: "2024-08-16",
      endDate: "2024-08-19",
      status: "pending",
      amount: 540.00,
      priority: "high"
    },
    {
      id: "RO-2024-047",
      customer: "Sarah Wilson",
      product: "Lighting Equipment Set",
      startDate: "2024-08-17",
      endDate: "2024-08-20",
      status: "confirmed",
      amount: 270.00,
      priority: "normal"
    }
  ],
  customerRequests: [
    {
      id: "REQ-001",
      customer: "John Smith",
      type: "Extension Request",
      product: "Camera Kit",
      originalReturn: "2024-08-15",
      requestedReturn: "2024-08-18",
      status: "pending",
      priority: "medium"
    },
    {
      id: "REQ-002",
      customer: "Emma Davis",
      type: "Early Return",
      product: "Sound System",
      originalReturn: "2024-08-20",
      requestedReturn: "2024-08-17",
      status: "approved",
      priority: "low"
    }
  ],
  notifications: [
    {
      id: "N001",
      type: "late_return",
      title: "Late Return Alert",
      message: "Camera Kit rental is 2 days overdue. Customer: John Smith",
      date: "2024-08-15",
      priority: "high"
    },
    {
      id: "N002",
      type: "maintenance",
      title: "Equipment Maintenance",
      message: "Sound System Package requires maintenance check",
      date: "2024-08-14",
      priority: "medium"
    },
    {
      id: "N003",
      type: "booking",
      title: "New Booking",
      message: "Professional Camera Kit booked for weekend event",
      date: "2024-08-13",
      priority: "low"
    }
  ],
  upcomingTasks: [
    {
      id: "T001",
      task: "Pickup - Camera Kit",
      customer: "Alice Johnson",
      location: "Downtown Store",
      time: "10:00 AM",
      date: "2024-08-15",
      type: "pickup"
    },
    {
      id: "T002",
      task: "Return - Sound System",
      customer: "Michael Brown",
      location: "Audio Center",
      time: "2:30 PM",
      date: "2024-08-15",
      type: "return"
    },
    {
      id: "T003",
      task: "Maintenance Check",
      product: "Lighting Equipment",
      location: "Workshop",
      time: "9:00 AM",
      date: "2024-08-16",
      type: "maintenance"
    }
  ]
}

export function EndUserPortal() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const sectionItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "order-management", label: "Order Management", icon: Package },
    { id: "customer-requests", label: "Customer Requests", icon: Users },
    { id: "schedule", label: "Schedule & Tasks", icon: CalendarSchedule },
    { id: "notifications", label: "Notifications", icon: AlertCircle },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "approved":
        return "default"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary" 
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">End User Portal</h1>
              <p className="text-gray-600">End User Dashboard & Management</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Badge variant="default">
                {endUserData.stats.activeRentals} Active Rentals
              </Badge>
              <div className="text-left sm:text-right">
                <div className="text-sm text-gray-500">Monthly Revenue</div>
                <div className="font-semibold">${endUserData.stats.totalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">End User Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sectionItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          activeSection === item.id 
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                            : "text-gray-700"
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 overflow-x-hidden">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{endUserData.stats.totalCustomers}</div>
                      <div className="text-sm text-green-600">+{endUserData.stats.monthlyGrowth}% this month</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Active Rentals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{endUserData.stats.activeRentals}</div>
                      <div className="text-sm text-gray-500">{endUserData.stats.pendingReturns} pending returns</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${endUserData.stats.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-green-600">+15% vs last month</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{endUserData.stats.customerSatisfaction}/5</div>
                      <div className="text-sm text-gray-500">Customer rating</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest rental orders requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endUserData.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{order.customer}</div>
                            <div className="text-sm text-gray-500">{order.product} • {order.id}</div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(order.startDate), "MMM dd")} - {format(new Date(order.endDate), "MMM dd")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${order.amount}</div>
                            <Badge variant={getStatusColor(order.status)} className="mt-1">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Tasks</CardTitle>
                    <CardDescription>Scheduled pickups, returns, and maintenance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {endUserData.upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{task.task}</div>
                            <div className="text-sm text-gray-500">
                              {task.customer && `Customer: ${task.customer} • `}
                              {task.location} • {task.time}
                            </div>
                          </div>
                          <Badge variant={task.type === "pickup" ? "default" : task.type === "return" ? "secondary" : "outline"}>
                            {task.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Order Management Section */}
            {activeSection === "order-management" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Manage all rental orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Order ID</TableHead>
                          <TableHead className="min-w-[120px]">Customer</TableHead>
                          <TableHead className="min-w-[150px]">Product</TableHead>
                          <TableHead className="min-w-[120px]">Date Range</TableHead>
                          <TableHead className="min-w-[100px]">Amount</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Priority</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {endUserData.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell>
                            {format(new Date(order.startDate), "MMM dd")} - {format(new Date(order.endDate), "MMM dd")}
                          </TableCell>
                          <TableCell>${order.amount}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(order.priority)}>{order.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Requests Section */}
            {activeSection === "customer-requests" && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Requests</CardTitle>
                  <CardDescription>Handle extension requests, early returns, and special requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endUserData.customerRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{request.type}</h3>
                            <p className="text-gray-600">Customer: {request.customer} • {request.id}</p>
                          </div>
                          <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-sm text-gray-500">Product</Label>
                            <div className="font-medium">{request.product}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Original Return</Label>
                            <div className="font-medium">{format(new Date(request.originalReturn), "MMM dd, yyyy")}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Requested Return</Label>
                            <div className="font-medium">{format(new Date(request.requestedReturn), "MMM dd, yyyy")}</div>
                          </div>
                        </div>
                        
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm">Approve</Button>
                            <Button size="sm" variant="outline">Decline</Button>
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Customer
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule & Tasks Section */}
            {activeSection === "schedule" && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule & Tasks</CardTitle>
                  <CardDescription>Daily schedule for pickups, returns, and maintenance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endUserData.upcomingTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{task.task}</h4>
                            <p className="text-sm text-gray-600">
                              {task.customer && `Customer: ${task.customer}`}
                              {task.product && `Product: ${task.product}`}
                            </p>
                          </div>
                          <Badge variant={
                            task.type === "pickup" ? "default" : 
                            task.type === "return" ? "secondary" : "outline"
                          }>
                            {task.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {task.location} • {task.time}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Mark Complete</Button>
                            <Button size="sm" variant="outline">Reschedule</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>Alerts, warnings, and system updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endUserData.notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 rounded-lg border-l-4 ${
                        notification.priority === "high" ? "border-red-500 bg-red-50" :
                        notification.priority === "medium" ? "border-yellow-500 bg-yellow-50" :
                        "border-blue-500 bg-blue-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{notification.title}</h4>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <div className="text-sm text-gray-500 mt-1">
                              {format(new Date(notification.date), "MMM dd")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports Section */}
            {activeSection === "reports" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Reports</CardTitle>
                    <CardDescription>Generate and download business analytics reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-24 flex flex-col">
                        <BarChart3 className="h-8 w-8 mb-2" />
                        Revenue Report
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col">
                        <Users className="h-8 w-8 mb-2" />
                        Customer Analytics
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col">
                        <Package className="h-8 w-8 mb-2" />
                        Product Performance
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col">
                        <Calendar className="h-8 w-8 mb-2" />
                        Rental Schedule
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col">
                        <DollarSign className="h-8 w-8 mb-2" />
                        Financial Summary
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col">
                        <Download className="h-8 w-8 mb-2" />
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system preferences and business rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Notification Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Late return alerts</Label>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Customer reminders</Label>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Maintenance alerts</Label>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-4">Business Rules</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Rental duration limits</Label>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Late fee calculations</Label>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Deposit requirements</Label>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
