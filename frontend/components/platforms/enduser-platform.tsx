"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EndUserNavigation } from "@/components/navigation/enduser-navigation"
import { ProductManagement } from "@/components/product-management"
import { OrderManagement } from "@/components/order-management"
import { EndUserPortal } from "@/components/end-user-portal"
import { PricingManagement } from "@/components/pricing-management"
import { DeliveryManagement } from "@/components/delivery-management"
import { ReportsAnalytics } from "@/components/reports-analytics"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

interface EndUserPlatformProps {
  userData: any
  onSignOut: () => void
}

// Hardcoded dashboard data for end users
const dashboardStats = {
  totalRevenue: 125000,
  activeRentals: 45,
  totalCustomers: 234,
  availableProducts: 89,
  pendingReturns: 12,
  overdueReturns: 3,
  monthlyGrowth: 15.2,
  customerSatisfaction: 4.7,
  topProducts: [
    { name: "Professional Camera Kit", rentals: 28, revenue: 15400 },
    { name: "Sound System Package", rentals: 22, revenue: 12100 },
    { name: "Lighting Equipment", rentals: 19, revenue: 9800 },
  ],
  recentOrders: [
    { id: "RO-001", customer: "John Smith", product: "Camera Kit", status: "confirmed", amount: 550 },
    { id: "RO-002", customer: "Sarah Johnson", product: "Sound System", status: "pickup", amount: 750 },
    { id: "RO-003", customer: "Mike Wilson", product: "Lighting", status: "returned", amount: 420 },
  ],
  alerts: [
    { type: "overdue", message: "3 items are overdue for return", priority: "high" },
    { type: "maintenance", message: "Camera Kit #2 needs maintenance check", priority: "medium" },
    { type: "stock", message: "Sound System Package low stock (2 units)", priority: "medium" }
  ]
}

export function EndUserPlatform({ userData, onSignOut }: EndUserPlatformProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pickup":
        return "secondary"
      case "returned":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden flex">
      <EndUserNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        userData={userData}
        onSignOut={onSignOut}
      />
      
      <main className="flex-1 ml-64 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          
          {/* End User Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">End User Dashboard</h1>
                <p className="text-gray-600">Welcome back, {userData.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{userData.role}</Badge>
                <Badge variant="outline">{userData.department}</Badge>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardStats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{dashboardStats.monthlyGrowth}% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.activeRentals}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.pendingReturns} pending returns
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active customer base
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.availableProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready for rental
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  System Alerts
                </CardTitle>
                <CardDescription>Items requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.priority === "high" ? "border-red-500 bg-red-50" :
                      alert.priority === "medium" ? "border-yellow-500 bg-yellow-50" :
                      "border-blue-500 bg-blue-50"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{alert.message}</span>
                        <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                          {alert.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest rental orders in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardStats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-gray-500">{order.product} • {order.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.amount}</div>
                          <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>Most rented items this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardStats.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.rentals} rentals</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${product.revenue.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Product Management */}
          <TabsContent value="product-management">
            <ProductManagement />
          </TabsContent>

          {/* Order Management */}
          <TabsContent value="order-management">
            <OrderManagement />
          </TabsContent>

          {/* Customer Management */}
          <TabsContent value="customer-management">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Customer Management</h1>
                <p className="text-gray-600">Manage customer accounts and relationships</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalCustomers}</div>
                    <div className="text-sm text-green-600">+12 this month</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">189</div>
                    <div className="text-sm text-gray-500">Currently renting</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Customer Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.customerSatisfaction}/5</div>
                    <div className="text-sm text-green-600">+0.2 this month</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Premium Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <div className="text-sm text-gray-500">19% of customers</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Overview</CardTitle>
                  <CardDescription>Recent customer activity and management tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Customer management functionality would be implemented here with customer list, search, and detailed customer profiles.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pricing Management */}
          <TabsContent value="pricing-management">
            <PricingManagement />
          </TabsContent>

          {/* Delivery Management */}
          <TabsContent value="delivery-management">
            <DeliveryManagement />
          </TabsContent>

          {/* Reports & Analytics */}
          <TabsContent value="reports-analytics">
            <ReportsAnalytics />
          </TabsContent>

          {/* End User Portal */}
          <TabsContent value="end-user-portal">
            <EndUserPortal />
          </TabsContent>

        </Tabs>
        </div>
      </main>
    </div>
  )
}
