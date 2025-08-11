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
import { Switch } from "@/components/ui/switch"
import { Plus, CalendarIcon, Edit, Trash2, DollarSign, Percent } from "lucide-react"
import { format } from "date-fns"

// Hardcoded pricing data
const pricelists = [
  {
    id: "PL-001",
    name: "Standard Pricing",
    description: "Default pricing for all customers",
    type: "standard",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    status: "active",
    customerSegment: "all",
    products: [
      { name: "Professional Camera Kit", hourly: 15, daily: 75, weekly: 450, monthly: 1500 },
      { name: "Sound System Package", hourly: 25, daily: 120, weekly: 720, monthly: 2400 },
      { name: "Lighting Equipment Set", hourly: 18, daily: 90, weekly: 540, monthly: 1800 },
    ],
  },
  {
    id: "PL-002",
    name: "Corporate Rates",
    description: "Special pricing for corporate clients",
    type: "corporate",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    status: "active",
    customerSegment: "corporate",
    products: [
      { name: "Professional Camera Kit", hourly: 12, daily: 60, weekly: 360, monthly: 1200 },
      { name: "Sound System Package", hourly: 20, daily: 96, weekly: 576, monthly: 1920 },
      { name: "Lighting Equipment Set", hourly: 15, daily: 72, weekly: 432, monthly: 1440 },
    ],
  },
  {
    id: "PL-003",
    name: "Holiday Special",
    description: "Seasonal pricing for holidays",
    type: "seasonal",
    validFrom: "2024-12-01",
    validTo: "2024-12-31",
    status: "active",
    customerSegment: "all",
    products: [
      { name: "Professional Camera Kit", hourly: 18, daily: 90, weekly: 540, monthly: 1800 },
      { name: "Sound System Package", hourly: 30, daily: 144, weekly: 864, monthly: 2880 },
      { name: "Lighting Equipment Set", hourly: 22, daily: 108, weekly: 648, monthly: 2160 },
    ],
  },
]

const discountRules = [
  {
    id: "DR-001",
    name: "Long Term Rental",
    description: "10% discount for rentals over 30 days",
    type: "duration",
    condition: "rental_days > 30",
    discount: 10,
    discountType: "percentage",
    status: "active",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
  },
  {
    id: "DR-002",
    name: "Bulk Order Discount",
    description: "$50 off orders over $500",
    type: "amount",
    condition: "order_total > 500",
    discount: 50,
    discountType: "fixed",
    status: "active",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
  },
  {
    id: "DR-003",
    name: "First Time Customer",
    description: "15% discount for new customers",
    type: "customer",
    condition: "first_order = true",
    discount: 15,
    discountType: "percentage",
    status: "active",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
  },
]

export function PricingManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPricelist, setSelectedPricelist] = useState<any>(null)
  const [showCreatePricelist, setShowCreatePricelist] = useState(false)
  const [showCreateDiscount, setShowCreateDiscount] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "expired":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "standard":
        return "default"
      case "corporate":
        return "secondary"
      case "seasonal":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">Manage pricelists, discounts, and pricing rules</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDiscount} onOpenChange={setShowCreateDiscount}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Percent className="h-4 w-4 mr-2" />
                Add Discount Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Discount Rule</DialogTitle>
                <DialogDescription>Set up automatic discount rules for your rental business</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input placeholder="Enter rule name" />
                </div>
                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duration">Duration Based</SelectItem>
                      <SelectItem value="amount">Order Amount</SelectItem>
                      <SelectItem value="customer">Customer Type</SelectItem>
                      <SelectItem value="product">Product Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Rule description" />
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valid From</Label>
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
                  <Label>Valid To</Label>
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
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDiscount(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDiscount(false)}>Create Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreatePricelist} onOpenChange={setShowCreatePricelist}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Pricelist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Pricelist</DialogTitle>
                <DialogDescription>
                  Set up a new pricelist for different customer segments or time periods
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pricelist Name</Label>
                  <Input placeholder="Enter pricelist name" />
                </div>
                <div className="space-y-2">
                  <Label>Customer Segment</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Pricelist description" />
                </div>
                <div className="space-y-2">
                  <Label>Valid From</Label>
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
                  <Label>Valid To</Label>
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
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch id="active" />
                  <Label htmlFor="active">Set as Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreatePricelist(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreatePricelist(false)}>Create Pricelist</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pricelists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricelists">Pricelists</TabsTrigger>
          <TabsTrigger value="discounts">Discount Rules</TabsTrigger>
          <TabsTrigger value="calculator">Price Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="pricelists" className="space-y-6">
          {/* Pricelist Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pricelists.map((pricelist) => (
              <Card key={pricelist.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pricelist.name}</CardTitle>
                      <CardDescription>{pricelist.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getTypeColor(pricelist.type)}>{pricelist.type}</Badge>
                      <Badge variant={getStatusColor(pricelist.status)}>{pricelist.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p>
                        <strong>Valid:</strong> {format(new Date(pricelist.validFrom), "MMM dd")} -{" "}
                        {format(new Date(pricelist.validTo), "MMM dd, yyyy")}
                      </p>
                      <p>
                        <strong>Segment:</strong> {pricelist.customerSegment}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sample Pricing:</p>
                      {pricelist.products.slice(0, 2).map((product, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{product.name}</p>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Daily: ${product.daily}</span>
                            <span>Weekly: ${product.weekly}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setSelectedPricelist(pricelist)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricelist Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Pricelists</CardTitle>
              <CardDescription>Complete overview of all pricing configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pricelist ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer Segment</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricelists.map((pricelist) => (
                    <TableRow key={pricelist.id}>
                      <TableCell className="font-medium">{pricelist.id}</TableCell>
                      <TableCell>{pricelist.name}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(pricelist.type)}>{pricelist.type}</Badge>
                      </TableCell>
                      <TableCell>{pricelist.customerSegment}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(pricelist.validFrom), "MMM dd")} -{" "}
                        {format(new Date(pricelist.validTo), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(pricelist.status)}>{pricelist.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Rules</CardTitle>
              <CardDescription>Automatic discount rules and promotional offers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.id}</TableCell>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.discountType === "percentage" ? `${rule.discount}%` : `$${rule.discount}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rule.condition}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(rule.validFrom), "MMM dd")} - {format(new Date(rule.validTo), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(rule.status)}>{rule.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Calculator</CardTitle>
              <CardDescription>Calculate rental prices with different configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Product</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Professional Camera Kit</SelectItem>
                        <SelectItem value="sound">Sound System Package</SelectItem>
                        <SelectItem value="lighting">Lighting Equipment Set</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rental Duration</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Quantity" />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rental Dates</Label>
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
                  <Button className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Calculate Price
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Price Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration Multiplier:</span>
                        <span>×1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Discount:</span>
                        <span>-$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seasonal Adjustment:</span>
                        <span>+$0.00</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total Price:</span>
                        <span>$0.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Applied Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      No pricing rules applied yet. Select product and duration to see applicable discounts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricelist Details Dialog */}
      {selectedPricelist && (
        <Dialog open={!!selectedPricelist} onOpenChange={() => setSelectedPricelist(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Pricelist Details - {selectedPricelist.name}</DialogTitle>
              <DialogDescription>
                Complete pricing information for {selectedPricelist.customerSegment} customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Pricelist Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>ID:</strong> {selectedPricelist.id}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedPricelist.type}
                    </p>
                    <p>
                      <strong>Customer Segment:</strong> {selectedPricelist.customerSegment}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedPricelist.status}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Validity Period</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>From:</strong> {format(new Date(selectedPricelist.validFrom), "PPP")}
                    </p>
                    <p>
                      <strong>To:</strong> {format(new Date(selectedPricelist.validTo), "PPP")}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Product Pricing</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Hourly</TableHead>
                      <TableHead>Daily</TableHead>
                      <TableHead>Weekly</TableHead>
                      <TableHead>Monthly</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPricelist.products.map((product: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>${product.hourly}</TableCell>
                        <TableCell>${product.daily}</TableCell>
                        <TableCell>${product.weekly}</TableCell>
                        <TableCell>${product.monthly}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Pricelist
              </Button>
              <Button variant="outline">Duplicate</Button>
              <Button>Export</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
