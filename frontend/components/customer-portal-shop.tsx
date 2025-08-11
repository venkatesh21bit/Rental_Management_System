"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Calendar as CalendarIcon, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Star, 
  Heart, 
  Clock, 
  CheckCircle,
  Filter,
  MapPin,
  Phone,
  Mail,
  Camera,
  Truck,
  Wrench,
  Home,
  Music,
  Gamepad2,
  Laptop
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"

// Rental products data
const rentalProducts = [
  {
    id: "RP001",
    name: "Professional Camera Kit",
    category: "Photography",
    description: "Complete professional photography setup with DSLR camera, lenses, and accessories",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 15,
      daily: 80,
      weekly: 450,
      monthly: 1600
    },
    deposit: 200,
    availability: "available",
    rating: 4.8,
    reviews: 156,
    features: ["Full Frame DSLR", "3 Professional Lenses", "Tripod & Accessories", "Carrying Case"],
    location: "Downtown Store"
  },
  {
    id: "RP002",
    name: "Wedding Decoration Package",
    category: "Events",
    description: "Complete wedding decoration setup including flowers, lighting, and centerpieces",
    image: "/placeholder.jpg",
    pricing: {
      daily: 350,
      weekly: 2000
    },
    deposit: 500,
    availability: "limited",
    rating: 4.9,
    reviews: 89,
    features: ["Floral Arrangements", "LED Lighting", "Table Centerpieces", "Backdrop Setup"],
    location: "Event Center"
  },
  {
    id: "RP003",
    name: "Power Tools Set",
    category: "Tools",
    description: "Professional grade power tools for construction and home improvement",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 8,
      daily: 45,
      weekly: 250,
      monthly: 900
    },
    deposit: 150,
    availability: "available",
    rating: 4.7,
    reviews: 203,
    features: ["Cordless Drill", "Circular Saw", "Impact Driver", "Tool Case"],
    location: "Hardware Store"
  },
  {
    id: "RP004",
    name: "Party Sound System",
    category: "Audio",
    description: "Professional sound system perfect for parties and events",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 12,
      daily: 60,
      weekly: 350
    },
    deposit: 100,
    availability: "available",
    rating: 4.6,
    reviews: 78,
    features: ["Wireless Microphones", "Bluetooth Connectivity", "LED Speakers", "Mixing Console"],
    location: "Audio Shop"
  },
  {
    id: "RP005",
    name: "Gaming Setup Complete",
    category: "Gaming",
    description: "Ultimate gaming experience with high-end PC and accessories",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 10,
      daily: 55,
      weekly: 320,
      monthly: 1200
    },
    deposit: 300,
    availability: "available",
    rating: 4.9,
    reviews: 92,
    features: ["RTX 4080 GPU", "32GB RAM", "4K Monitor", "Gaming Peripherals"],
    location: "Tech Store"
  },
  {
    id: "RP006",
    name: "Laptop Workstation",
    category: "Technology",
    description: "High-performance laptop perfect for business and creative work",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 6,
      daily: 35,
      weekly: 200,
      monthly: 750
    },
    deposit: 200,
    availability: "available",
    rating: 4.5,
    reviews: 134,
    features: ["Intel i7 Processor", "16GB RAM", "512GB SSD", "External Monitor"],
    location: "Tech Store"
  }
]

const categories = [
  { id: "all", name: "All Categories", icon: Package },
  { id: "photography", name: "Photography", icon: Camera },
  { id: "events", name: "Events", icon: Heart },
  { id: "tools", name: "Tools", icon: Wrench },
  { id: "audio", name: "Audio", icon: Music },
  { id: "gaming", name: "Gaming", icon: Gamepad2 },
  { id: "technology", name: "Technology", icon: Laptop }
]

export function CustomerPortalShop() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [rentalDuration, setRentalDuration] = useState("daily")
  const [showCart, setShowCart] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })

  // Filter products based on search and category
  const filteredProducts = rentalProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           product.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Calculate rental price based on duration
  const calculateRentalPrice = (product: any, days: number, durationType: string) => {
    const pricing = product.pricing
    
    switch (durationType) {
      case "hourly":
        return pricing.hourly * days * 24 // Assuming full day usage
      case "daily":
        return pricing.daily * days
      case "weekly":
        const weeks = Math.ceil(days / 7)
        return pricing.weekly * weeks
      case "monthly":
        const months = Math.ceil(days / 30)
        return pricing.monthly * months
      default:
        return pricing.daily * days
    }
  }

  // Add product to cart
  const addToCart = (product: any, startDate: Date, endDate: Date, duration: string) => {
    const days = differenceInDays(endDate, startDate) + 1
    const price = calculateRentalPrice(product, days, duration)
    
    const cartItem = {
      id: product.id,
      name: product.name,
      startDate: startDate,
      endDate: endDate,
      duration: duration,
      days: days,
      price: price,
      deposit: product.deposit,
      total: price + product.deposit
    }
    
    setCart([...cart, cartItem])
    setShowBookingDialog(false)
    setSelectedProduct(null)
  }

  // Remove from cart
  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
  }

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RentalPro Shop</h1>
              <p className="text-gray-600 mt-1">Rent quality products for any occasion</p>
            </div>
            <Button 
              onClick={() => setShowCart(true)} 
              className="relative"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({cart.length})
              {cart.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  ${cartTotal.toFixed(2)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <Badge 
                  variant={product.availability === "available" ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                >
                  {product.availability === "available" ? "Available" : "Limited"}
                </Badge>
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium ml-1">{product.rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({product.reviews})</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {product.pricing.hourly && (
                      <div>Hourly: <span className="font-medium">${product.pricing.hourly}</span></div>
                    )}
                    <div>Daily: <span className="font-medium">${product.pricing.daily}</span></div>
                    {product.pricing.weekly && (
                      <div>Weekly: <span className="font-medium">${product.pricing.weekly}</span></div>
                    )}
                    {product.pricing.monthly && (
                      <div>Monthly: <span className="font-medium">${product.pricing.monthly}</span></div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    Deposit: <span className="font-medium">${product.deposit}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{product.name}</DialogTitle>
                        <DialogDescription>{product.description}</DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Features:</h4>
                          <ul className="space-y-1 mb-4">
                            {product.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium">{product.rating}</span>
                              <span className="text-gray-500 ml-1">({product.reviews} reviews)</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm">{product.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowBookingDialog(true)
                    }}
                    className="flex-1"
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Select your rental dates and duration</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Rental Duration Type</Label>
              <Select value={rentalDuration} onValueChange={setRentalDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.pricing.hourly && (
                    <SelectItem value="hourly">Hourly - ${selectedProduct.pricing.hourly}/hour</SelectItem>
                  )}
                  <SelectItem value="daily">Daily - ${selectedProduct?.pricing.daily}/day</SelectItem>
                  {selectedProduct?.pricing.weekly && (
                    <SelectItem value="weekly">Weekly - ${selectedProduct.pricing.weekly}/week</SelectItem>
                  )}
                  {selectedProduct?.pricing.monthly && (
                    <SelectItem value="monthly">Monthly - ${selectedProduct.pricing.monthly}/month</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {startDate && endDate && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Duration:</span>
                  <span className="font-medium">{differenceInDays(endDate, startDate) + 1} days</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Rental Price:</span>
                  <span className="font-medium">
                    ${calculateRentalPrice(selectedProduct, differenceInDays(endDate, startDate) + 1, rentalDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Security Deposit:</span>
                  <span className="font-medium">${selectedProduct?.deposit}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span>
                    ${calculateRentalPrice(selectedProduct, differenceInDays(endDate, startDate) + 1, rentalDuration) + (selectedProduct?.deposit || 0)}
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={() => startDate && endDate && addToCart(selectedProduct, startDate, endDate, rentalDuration)}
              disabled={!startDate || !endDate}
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shopping Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>Review your rental items and checkout</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500">Add some products to get started.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeFromCart(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Duration: {format(item.startDate, "MMM dd")} - {format(item.endDate, "MMM dd")} ({item.days} days)</div>
                        <div>Type: {item.duration}</div>
                        <div>Rental: ${item.price} + Deposit: ${item.deposit}</div>
                        <div className="font-semibold">Total: ${item.total}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Cart Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Full Name</Label>
                      <Input 
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Enter your phone"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input 
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Payment
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
