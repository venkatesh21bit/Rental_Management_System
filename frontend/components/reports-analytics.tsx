"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BarChart3, TrendingUp, Download, CalendarIcon, DollarSign, Package, Users, Clock } from "lucide-react"
import { format } from "date-fns"

// Hardcoded analytics data
const revenueData = {
  totalRevenue: 125000,
  monthlyGrowth: 15.2,
  averageOrderValue: 285,
  totalOrders: 438,
  monthlyData: [
    { month: "Jan", revenue: 8500, orders: 32 },
    { month: "Feb", revenue: 9200, orders: 35 },
    { month: "Mar", revenue: 10800, orders: 41 },
    { month: "Apr", revenue: 12500, orders: 48 },
    { month: "May", revenue: 11200, orders: 42 },
    { month: "Jun", revenue: 13800, orders: 52 },
  ],
}

const productAnalytics = [
  {
    product: "Professional Camera Kit",
    totalRentals: 89,
    revenue: 22400,
    averageDuration: 3.2,
    utilizationRate: 78,
    topCustomer: "John Smith Photography",
  },
  {
    product: "Sound System Package",
    totalRentals: 67,
    revenue: 18900,
    averageDuration: 2.8,
    utilizationRate: 65,
    topCustomer: "Event Solutions Inc",
  },
  {
    product: "Lighting Equipment Set",
    totalRentals: 54,
    revenue: 14200,
    averageDuration: 2.5,
    utilizationRate: 58,
    topCustomer: "Creative Studios",
  },
  {
    product: "Video Editing Workstation",
    totalRentals: 32,
    revenue: 8900,
    averageDuration: 5.1,
    utilizationRate: 45,
    topCustomer: "Media Productions",
  },
]

const customerAnalytics = [
  {
    customer: "John Smith Photography",
    totalOrders: 12,
    totalRevenue: 3200,
    averageOrderValue: 267,
    lastOrder: "2024-01-15",
    status: "VIP",
  },
  {
    customer: "Event Solutions Inc",
    totalOrders: 8,
    totalRevenue: 2800,
    averageOrderValue: 350,
    lastOrder: "2024-01-18",
    status: "Corporate",
  },
  {
    customer: "Creative Studios",
    totalOrders: 6,
    totalRevenue: 1950,
    averageOrderValue: 325,
    lastOrder: "2024-01-20",
    status: "Regular",
  },
  {
    customer: "Media Productions",
    totalOrders: 5,
    totalRevenue: 1750,
    averageOrderValue: 350,
    lastOrder: "2024-01-22",
    status: "Corporate",
  },
]

const delayAnalytics = [
  {
    orderId: "RO-045",
    customer: "Sarah Johnson",
    product: "Professional Camera Kit",
    dueDate: "2024-01-20",
    daysOverdue: 3,
    lateFee: 45,
    status: "contacted",
  },
  {
    orderId: "RO-052",
    customer: "Mike Wilson",
    product: "Sound System Package",
    dueDate: "2024-01-22",
    daysOverdue: 1,
    lateFee: 15,
    status: "pending",
  },
]

export function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [selectedPeriod, setSelectedPeriod] = useState<Date>()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIP":
        return "default"
      case "Corporate":
        return "secondary"
      case "Regular":
        return "outline"
      case "contacted":
        return "secondary"
      case "pending":
        return "destructive"
      default:
        return "outline"
    }
  }

  const exportReport = (type: string) => {
    // Simulate report export
    console.log(`Exporting ${type} report...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedPeriod ? format(selectedPeriod, "PPP") : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedPeriod} onSelect={setSelectedPeriod} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="delays">Delays & Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+{revenueData.monthlyGrowth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Across all products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData.averageOrderValue}</div>
                <p className="text-xs text-muted-foreground">Per rental order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">234</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue and order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Revenue chart visualization</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Interactive charts would be implemented with a charting library
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>By rental frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productAnalytics.slice(0, 3).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.product}</p>
                        <p className="text-xs text-muted-foreground">{product.totalRentals} rentals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${product.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{product.utilizationRate}% utilized</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>By total revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerAnalytics.slice(0, 3).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{customer.customer}</p>
                        <p className="text-xs text-muted-foreground">{customer.totalOrders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${customer.totalRevenue.toLocaleString()}</p>
                        <Badge variant={getStatusColor(customer.status)} className="text-xs">
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Revenue Analytics</h2>
            <Button onClick={() => exportReport("revenue")}>
              <Download className="h-4 w-4 mr-2" />
              Export Revenue Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.monthlyData.map((month, index) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month} 2024</TableCell>
                      <TableCell>${month.revenue.toLocaleString()}</TableCell>
                      <TableCell>{month.orders}</TableCell>
                      <TableCell>${Math.round(month.revenue / month.orders)}</TableCell>
                      <TableCell>
                        {index > 0 && (
                          <span
                            className={`text-sm ${
                              month.revenue > revenueData.monthlyData[index - 1].revenue
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {month.revenue > revenueData.monthlyData[index - 1].revenue ? "+" : ""}
                            {(
                              ((month.revenue - revenueData.monthlyData[index - 1].revenue) /
                                revenueData.monthlyData[index - 1].revenue) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Product Performance</h2>
            <Button onClick={() => exportReport("products")}>
              <Download className="h-4 w-4 mr-2" />
              Export Product Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>Performance metrics for all rental products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Total Rentals</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Duration</TableHead>
                    <TableHead>Utilization Rate</TableHead>
                    <TableHead>Top Customer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productAnalytics.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell>{product.totalRentals}</TableCell>
                      <TableCell>${product.revenue.toLocaleString()}</TableCell>
                      <TableCell>{product.averageDuration} days</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${product.utilizationRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{product.utilizationRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{product.topCustomer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Customer Analytics</h2>
            <Button onClick={() => exportReport("customers")}>
              <Download className="h-4 w-4 mr-2" />
              Export Customer Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Performance</CardTitle>
              <CardDescription>Top customers by revenue and order frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAnalytics.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.customer}</TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>${customer.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>${customer.averageOrderValue}</TableCell>
                      <TableCell>{format(new Date(customer.lastOrder), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(customer.status)}>{customer.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delays" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Delays & Returns</h2>
            <Button onClick={() => exportReport("delays")}>
              <Download className="h-4 w-4 mr-2" />
              Export Delays Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{delayAnalytics.length}</div>
                <p className="text-xs text-muted-foreground">Items past due date</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Fees Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${delayAnalytics.reduce((sum, item) => sum + item.lateFee, 0)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delay</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {delayAnalytics.length > 0
                    ? Math.round(
                        delayAnalytics.reduce((sum, item) => sum + item.daysOverdue, 0) / delayAnalytics.length,
                      )
                    : 0}{" "}
                  days
                </div>
                <p className="text-xs text-muted-foreground">Average overdue period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overdue Returns</CardTitle>
              <CardDescription>Items that are past their return date</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delayAnalytics.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.orderId}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{format(new Date(item.dueDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-red-600 font-medium">{item.daysOverdue}</TableCell>
                      <TableCell>${item.lateFee}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Contact
                          </Button>
                          <Button variant="ghost" size="sm">
                            Extend
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
      </Tabs>
    </div>
  )
}
