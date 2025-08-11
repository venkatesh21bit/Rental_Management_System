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
  Filter
} from "lucide-react"
import { format, addDays } from "date-fns"

// Customer Portal Data - Based on Architecture
const customerData = {
    profile: {
      id: "CUST-001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main Street, New York, NY 10001",
      memberSince: "2023-01-15",
      totalOrders: 12,
      totalSpent: 4560.00,
      status: "Premium"
    },
  currentRentals: [
    {
      id: "RO-2024-001",
      product: "Professional Camera Kit",
      startDate: "2024-08-10",
      endDate: "2024-08-15",
      status: "active",
      amount: 375.00,
      deposit: 200.00,
      location: "Downtown Store",
      returnDate: "2024-08-15"
    },
    {
      id: "RO-2024-002", 
      product: "Sound System Package",
      startDate: "2024-08-12",
      endDate: "2024-08-14",
      status: "active",
      amount: 180.00,
      deposit: 100.00,
      location: "Audio Center",
      returnDate: "2024-08-14"
    }
  ],
  orderHistory: [
    {
      id: "RO-2024-003",
      product: "Power Tools Set",
      startDate: "2024-07-20",
      endDate: "2024-07-25",
      status: "completed",
      amount: 225.00,
      deposit: 150.00,
      rating: 5,
      review: "Excellent tools, great condition"
    },
    {
      id: "RO-2024-004",
      product: "Party Decoration Package",
      startDate: "2024-07-10",
      endDate: "2024-07-12",
      status: "completed",
      amount: 280.00,
      deposit: 100.00,
      rating: 4,
      review: "Good quality decorations"
    }
  ],
  notifications: [
    {
      id: "N001",
      type: "reminder",
      title: "Return Reminder",
      message: "Camera Kit rental ends tomorrow. Please return to Downtown Store.",
      date: "2024-08-14",
      priority: "high"
    },
    {
      id: "N002",
      type: "promotion",
      title: "Weekend Special",
      message: "20% off on all weekend rentals. Book now!",
      date: "2024-08-13",
      priority: "medium"
    }
  ],
  invoices: [
    {
      id: "INV-2024-001",
      orderRef: "RO-2024-001",
      amount: 375.00,
      status: "paid",
      date: "2024-08-10",
      downloadUrl: "#"
    },
    {
      id: "INV-2024-002",
      orderRef: "RO-2024-002", 
      amount: 180.00,
      status: "paid",
      date: "2024-08-12",
      downloadUrl: "#"
    }
  ]
}

export function CustomerPortal() {
  const [activeSection, setActiveSection] = useState("dashboard")
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: customerData.profile.name,
    email: customerData.profile.email,
    phone: customerData.profile.phone,
    address: customerData.profile.address
  })

  // Shop states
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  // Add states for dialogs and actions
  const [showOrderDetails, setShowOrderDetails] = useState<any>(null)
  const [showExtendRental, setShowExtendRental] = useState<any>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Action handlers
  const handleViewOrderDetails = (order: any) => {
    setShowOrderDetails(order)
  }

  const handleExtendRental = (rental: any) => {
    setShowExtendRental(rental)
  }

  const handleContactSupport = (rental: any) => {
    alert(`Contacting support for ${rental.product} (${rental.id}). You will be redirected to our support team.`)
  }

  const handleDownloadInvoice = (invoice: any) => {
    // Simulate download
    alert(`Downloading invoice ${invoice.id}. In a real app, this would trigger a file download.`)
  }

  const handleUpdateProfile = () => {
    alert("Profile updated successfully!")
    // In a real app, you would save to backend
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters!")
      return
    }
    alert("Password changed successfully!")
    setShowPasswordChange(false)
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "browse":
        setActiveSection("shop")
        break
      case "orders":
        setActiveSection("order-history")
        break
      case "profile":
        setActiveSection("profile")
        break
    }
  }

  const sectionItems = [
    { id: "dashboard", label: "Dashboard", icon: User },
    { id: "shop", label: "Browse Products", icon: Package },
    { id: "current-rentals", label: "Current Rentals", icon: Package },
    { id: "order-history", label: "Order History", icon: FileText },
    { id: "notifications", label: "Notifications", icon: AlertCircle },
    { id: "invoices", label: "Invoices & Billing", icon: DollarSign },
    { id: "profile", label: "My Profile", icon: User }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              <p className="text-gray-600">Welcome back, {customerData.profile.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={customerData.profile.status === "Premium" ? "default" : "secondary"}>
                {customerData.profile.status} Member
              </Badge>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Spent</div>
                <div className="font-semibold">${customerData.profile.totalSpent.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
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
          <div className="flex-1">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Active Rentals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerData.currentRentals.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerData.profile.totalOrders}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${customerData.profile.totalSpent.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Member Since</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{format(new Date(customerData.profile.memberSince), "MMM yyyy")}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        className="h-16"
                        onClick={() => handleQuickAction("browse")}
                      >
                        <Package className="h-6 w-6 mr-2" />
                        Browse Products
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-16"
                        onClick={() => handleQuickAction("orders")}
                      >
                        <FileText className="h-6 w-6 mr-2" />
                        View Orders
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-16"
                        onClick={() => handleQuickAction("profile")}
                      >
                        <User className="h-6 w-6 mr-2" />
                        Update Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customerData.currentRentals.map((rental) => (
                        <div key={rental.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{rental.product}</div>
                            <div className="text-sm text-gray-500">Order: {rental.id}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="default">Active</Badge>
                            <div className="text-sm text-gray-500 mt-1">
                              Return: {format(new Date(rental.endDate), "MMM dd")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Shop Section */}
            {activeSection === "shop" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Browse Products</CardTitle>
                    <CardDescription>Discover and rent high-quality products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Enhanced Shopping Experience</h3>
                      <p className="text-gray-600 mb-4">
                        For the full shopping experience with advanced filters, cart functionality, 
                        and detailed product views, please use our dedicated shop interface.
                      </p>
                      <Button
                        onClick={() => {
                          // In a real app, this would navigate to the CustomerPortalShop component
                          alert("This would navigate to the enhanced shopping interface with full cart functionality!")
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Go to Enhanced Shop
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Product Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableProducts.slice(0, 6).map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">${product.pricePerDay}/day</span>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{product.rating}</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full mt-2">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Current Rentals Section */}
            {activeSection === "current-rentals" && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Rentals</CardTitle>
                  <CardDescription>Manage your active rental orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerData.currentRentals.map((rental) => (
                      <div key={rental.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{rental.product}</h3>
                            <p className="text-gray-600">Order ID: {rental.id}</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label className="text-sm text-gray-500">Start Date</Label>
                            <div className="font-medium">{format(new Date(rental.startDate), "MMM dd, yyyy")}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">End Date</Label>
                            <div className="font-medium">{format(new Date(rental.endDate), "MMM dd, yyyy")}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Location</Label>
                            <div className="font-medium">{rental.location}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Amount</Label>
                            <div className="font-medium">${rental.amount}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleViewOrderDetails(rental)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExtendRental(rental)}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Extend Rental
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleContactSupport(rental)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order History Section */}
            {activeSection === "order-history" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your past rental orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerData.orderHistory.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell>
                            {format(new Date(order.startDate), "MMM dd")} - {format(new Date(order.endDate), "MMM dd")}
                          </TableCell>
                          <TableCell>${order.amount}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < order.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Stay updated with your rental activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerData.notifications.map((notification) => (
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
                          <div className="text-sm text-gray-500">
                            {format(new Date(notification.date), "MMM dd")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoices & Billing Section */}
            {activeSection === "invoices" && (
              <Card>
                <CardHeader>
                  <CardTitle>Invoices & Billing</CardTitle>
                  <CardDescription>Download invoices and manage billing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Order Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerData.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.orderRef}</TableCell>
                          <TableCell>{format(new Date(invoice.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>${invoice.amount}</TableCell>
                          <TableCell>
                            <Badge variant="default">Paid</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadInvoice(invoice)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={profileForm.name} 
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input 
                          value={profileForm.email} 
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input 
                          value={profileForm.phone} 
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Address</Label>
                        <Textarea 
                          value={profileForm.address} 
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          rows={3} 
                        />
                      </div>
                      <div>
                        <Label>Member Since</Label>
                        <Input value={format(new Date(customerData.profile.memberSince), "MMMM dd, yyyy")} readOnly />
                      </div>
                      <div>
                        <Label>Account Status</Label>
                        <Input value={customerData.profile.status} readOnly />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-4">
                    <Button onClick={handleUpdateProfile}>Update Profile</Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPasswordChange(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!showOrderDetails} onOpenChange={() => setShowOrderDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about your order
            </DialogDescription>
          </DialogHeader>
          {showOrderDetails && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Order ID</Label>
                <div className="font-medium">{showOrderDetails.id}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Product</Label>
                <div className="font-medium">{showOrderDetails.product}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Start Date</Label>
                  <div className="font-medium">
                    {format(new Date(showOrderDetails.startDate), "MMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">End Date</Label>
                  <div className="font-medium">
                    {format(new Date(showOrderDetails.endDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Amount</Label>
                  <div className="font-medium">${showOrderDetails.amount}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge variant={showOrderDetails.status === "active" ? "default" : "secondary"}>
                    {showOrderDetails.status}
                  </Badge>
                </div>
              </div>
              {showOrderDetails.location && (
                <div>
                  <Label className="text-sm text-gray-500">Location</Label>
                  <div className="font-medium">{showOrderDetails.location}</div>
                </div>
              )}
              {showOrderDetails.rating && (
                <div>
                  <Label className="text-sm text-gray-500">Your Rating</Label>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < showOrderDetails.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showOrderDetails.review && (
                <div>
                  <Label className="text-sm text-gray-500">Your Review</Label>
                  <div className="text-sm">{showOrderDetails.review}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Rental Dialog */}
      <Dialog open={!!showExtendRental} onOpenChange={() => setShowExtendRental(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Rental</DialogTitle>
            <DialogDescription>
              Extend your rental period for {showExtendRental?.product}
            </DialogDescription>
          </DialogHeader>
          {showExtendRental && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Current End Date</Label>
                <div className="font-medium">
                  {format(new Date(showExtendRental.endDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <Label htmlFor="newEndDate">New End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    alert(`Rental extended successfully until ${endDate ? format(endDate, "MMM dd, yyyy") : "selected date"}!`)
                    setShowExtendRental(null)
                    setEndDate(undefined)
                  }}
                  disabled={!endDate}
                >
                  Confirm Extension
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExtendRental(null)
                    setEndDate(undefined)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleChangePassword}>
                Change Password
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordChange(false)
                  setNewPassword("")
                  setConfirmPassword("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
const availableProducts = [
  {
    id: "P001",
    name: "Professional Camera Kit",
    category: "Photography",
    description:
      "Complete DSLR camera kit with multiple lenses, tripod, and accessories. Perfect for professional photography and videography.",
    image: "/placeholder.svg?height=200&width=300&text=Camera",
    rating: 4.8,
    reviews: 124,
    pricePerDay: 75,
    availability: "available",
    features: [
      "Canon EOS R5",
      "24-70mm f/2.8 Lens",
      "85mm f/1.4 Lens",
      "Professional Tripod",
      "Memory Cards",
      "Batteries",
    ],
  },
  {
    id: "P002",
    name: "Sound System Package",
    category: "Audio",
    description:
      "Professional PA system with wireless microphones, speakers, and mixing console. Ideal for events and presentations.",
    image: "/placeholder.svg?height=200&width=300&text=Audio",
    rating: 4.6,
    reviews: 89,
    pricePerDay: 120,
    availability: "available",
    features: [
      '2x 15" Speakers',
      "Wireless Microphones",
      "Mixing Console",
      "Cables & Stands",
      "Bluetooth Connectivity",
    ],
  },
  {
    id: "P003",
    name: "Lighting Equipment Set",
    category: "Lighting",
    description:
      "Studio lighting kit with LED panels, softboxes, and light stands. Create professional lighting setups.",
    image: "/placeholder.svg?height=200&width=300&text=Lights",
    rating: 4.7,
    reviews: 67,
    pricePerDay: 90,
    availability: "limited",
    features: ["3x LED Panels", "Softboxes", "Light Stands", "Color Gels", "Remote Controls"],
  },
  {
    id: "P004",
    name: "Video Editing Workstation",
    category: "Technology",
    description:
      "High-performance computer setup for video editing with professional software and high-resolution monitors.",
    image: "/placeholder.svg?height=200&width=300&text=Computer",
    rating: 4.9,
    reviews: 45,
    pricePerDay: 50,
    availability: "rented",
    features: [
      "Intel i9 Processor",
      "32GB RAM",
      "RTX 4080 GPU",
      "4K Monitor",
      "Adobe Creative Suite",
      "DaVinci Resolve",
    ],
  },
]

const endUserOrders = [
  {
    id: "RO-001",
    products: ["Professional Camera Kit"],
    startDate: "2024-01-15",
    endDate: "2024-01-18",
    status: "active",
    totalAmount: 225,
    paidAmount: 225,
  },
  {
    id: "RO-002",
    products: ["Sound System Package", "Lighting Equipment Set"],
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    status: "upcoming",
    totalAmount: 420,
    paidAmount: 200,
  },
]

export function EndUserPortal() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "default"
      case "limited":
        return "secondary"
      case "rented":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "upcoming":
        return "secondary"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, quantity: 1, startDate, endDate }])
  }

  const calculateDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 1
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Welcome to RentalPro</h1>
        <p className="text-xl text-muted-foreground mb-6">Find and rent professional equipment for your projects</p>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">500+</div>
            <div className="text-sm text-muted-foreground">Products Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-muted-foreground">User Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">1000+</div>
            <div className="text-sm text-muted-foreground">Happy Users</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="cart">Cart ({cart.length})</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Find Equipment</CardTitle>
              <CardDescription>Search and filter our extensive rental catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {startDate ? format(startDate, "MMM dd") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {endDate ? format(endDate, "MMM dd") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </div>
                    <Badge variant={getAvailabilityColor(product.availability)}>{product.availability}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold">${product.pricePerDay}</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                    {startDate && endDate && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{calculateDays()} days</div>
                        <div className="font-bold">${product.pricePerDay * calculateDays()}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setSelectedProduct(product)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={product.availability === "rented"}
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
              <CardDescription>Review your selected items and proceed to checkout</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-2">Add some products to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          {item.startDate && item.endDate && (
                            <p className="text-sm text-muted-foreground">
                              {format(item.startDate, "MMM dd")} - {format(item.endDate, "MMM dd")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.pricePerDay * calculateDays()}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.pricePerDay}/day × {calculateDays()} days
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold">
                        ${cart.reduce((total, item) => total + item.pricePerDay * calculateDays(), 0)}
                      </span>
                    </div>
                    <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Proceed to Checkout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Complete Your Booking</DialogTitle>
                          <DialogDescription>Provide your details and payment information</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input placeholder="Enter your name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" placeholder="your@email.com" />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input placeholder="+1 (555) 000-0000" />
                          </div>
                          <div className="space-y-2">
                            <Label>Company (Optional)</Label>
                            <Input placeholder="Company name" />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Delivery Address</Label>
                            <Textarea placeholder="Enter full delivery address" />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Special Instructions</Label>
                            <Textarea placeholder="Any special requirements or notes" />
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2">Order Summary</h3>
                          <div className="space-y-1 text-sm">
                            {cart.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span>${item.pricePerDay * calculateDays()}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>
                                ${cart.reduce((total, item) => total + item.pricePerDay * calculateDays(), 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setShowBookingDialog(false)}>Confirm Booking</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>Track your current and past rental orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endUserOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.startDate), "MMM dd")} -{" "}
                          {format(new Date(order.endDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Products:</p>
                        <p className="text-sm text-muted-foreground">{order.products.join(", ")}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm">Total: ${order.totalAmount}</p>
                          <p className="text-sm text-muted-foreground">Paid: ${order.paidAmount}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {order.status === "upcoming" && (
                            <Button variant="outline" size="sm">
                              Modify
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="+1 234-567-8901" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input defaultValue="Smith Photography" />
                </div>
                <Button>Update Profile</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
                <CardDescription>Default delivery location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input defaultValue="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input defaultValue="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input defaultValue="NY" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input defaultValue="10001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input defaultValue="United States" />
                  </div>
                </div>
                <Button>Update Address</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rental History</CardTitle>
              <CardDescription>Your past rental activity and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$2,450</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4.9</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Professional Camera Kit</p>
                        <p className="text-sm text-muted-foreground">Completed on Jan 18, 2024</p>
                      </div>
                    </div>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Sound System Package</p>
                        <p className="text-sm text-muted-foreground">Upcoming on Jan 20, 2024</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {selectedProduct.category} • {selectedProduct.availability}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(selectedProduct.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What's Included</h3>
                  <ul className="text-sm space-y-1">
                    {selectedProduct.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Rental Price</span>
                    <span className="text-2xl font-bold">${selectedProduct.pricePerDay}/day</span>
                  </div>
                  {startDate && endDate && (
                    <div className="text-sm text-muted-foreground">
                      {calculateDays()} days = ${selectedProduct.pricePerDay * calculateDays()} total
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                Add to Wishlist
              </Button>
              <Button
                disabled={selectedProduct.availability === "rented"}
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
