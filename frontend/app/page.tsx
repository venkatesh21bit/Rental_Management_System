"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, DollarSign } from "lucide-react"
import { ProductManagement } from "@/components/product-management"
import { OrderManagement } from "@/components/order-management"
import { CustomerPortal } from "@/components/customer-portal"
import { DeliveryManagement } from "@/components/delivery-management"
import { PricingManagement } from "@/components/pricing-management"
import { ReportsAnalytics } from "@/components/reports-analytics"
import { Navigation } from "@/components/navigation"

// Hardcoded dashboard data
const dashboardStats = {
  totalRevenue: 125000,
  activeRentals: 45,
  totalCustomers: 234,
  availableProducts: 89,
  pendingReturns: 12,
  overdueReturns: 3,
  monthlyGrowth: 15.2,
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
}

export default function RentalManagementSystem() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Rental Management Dashboard</h1>
              <Badge variant="outline" className="text-sm">
                Last updated: {new Date().toLocaleDateString()}
              </Badge>
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
                  <p className="text-xs text-muted-foreground">+{dashboardStats.monthlyGrowth}% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.activeRentals}</div>
                  <p className="text-xs text-muted-foreground">Currently rented out</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.availableProducts}</div>
                  <p className="text-xs text-muted-foreground">Ready for rental</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Pending Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Due Today</span>
                      <Badge variant="destructive">{dashboardStats.overdueReturns}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Due This Week</span>
                      <Badge variant="secondary">{dashboardStats.pendingReturns}</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View All Returns
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardStats.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.rentals} rentals</p>
                        </div>
                        <span className="font-bold">${product.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest rental orders and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardStats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customer}</p>
                        </div>
                        <div>
                          <p className="text-sm">{order.product}</p>
                          <Badge
                            variant={
                              order.status === "confirmed"
                                ? "default"
                                : order.status === "pickup"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${order.amount}</p>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsAnalytics />
          </TabsContent>

          <TabsContent value="customer-portal">
            <CustomerPortal />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
