"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Laptop,
  Grid3x3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Plus
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { ProductDetail } from "./product-detail"
import { CartPage } from "./cart-page"
import { DeliveryPage } from "./delivery-page"
import { PaymentPage } from "./payment-page"

// Enhanced rental products data with more attributes
const rentalProducts = [
  {
    id: "RP001",
    name: "Professional Camera Kit",
    category: "Photography",
    brand: "Canon",
    color: "Black",
    condition: "Excellent",
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
    location: "Downtown Store",
    weight: "2.5kg",
    dimensions: "30x20x15cm"
  },
  {
    id: "RP002",
    name: "Wedding Decoration Package",
    category: "Events",
    brand: "EventPro",
    color: "Multi-color",
    condition: "Good",
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
    location: "Event Center",
    weight: "15kg",
    dimensions: "Various sizes"
  },
  {
    id: "RP003",
    name: "Power Tools Set",
    category: "Tools",
    brand: "DeWalt",
    color: "Yellow",
    condition: "Excellent",
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
    location: "Hardware Store",
    weight: "8kg",
    dimensions: "50x30x20cm"
  },
  {
    id: "RP004",
    name: "Party Sound System",
    category: "Audio",
    brand: "JBL",
    color: "Black",
    condition: "Good",
    description: "Professional sound system perfect for parties and events",
    image: "/placeholder.jpg",
    pricing: {
      hourly: 12,
      daily: 75,
      weekly: 400,
      monthly: 1400
    },
    deposit: 300,
    availability: "available",
    rating: 4.6,
    reviews: 124,
    features: ["Wireless Microphones", "Bluetooth Connectivity", "LED Light Show", "Remote Control"],
    location: "Audio Center",
    weight: "12kg",
    dimensions: "60x40x35cm"
  },
  {
    id: "RP005",
    name: "Gaming Console Bundle",
    category: "Entertainment",
    brand: "Sony",
    color: "White",
    condition: "Excellent",
    description: "Latest gaming console with controllers and popular games",
    image: "/placeholder.jpg",
    pricing: {
      daily: 25,
      weekly: 150,
      monthly: 500
    },
    deposit: 100,
    availability: "available",
    rating: 4.9,
    reviews: 78,
    features: ["2 Controllers", "5 Popular Games", "4K Gaming", "Online Access"],
    location: "Gaming Store",
    weight: "3kg",
    dimensions: "40x25x10cm"
  },
  {
    id: "RP006",
    name: "Laptop - MacBook Pro",
    category: "Technology",
    brand: "Apple",
    color: "Silver",
    condition: "Excellent",
    description: "High-performance laptop for professional work and creative projects",
    image: "/placeholder.jpg",
    pricing: {
      daily: 40,
      weekly: 250,
      monthly: 900
    },
    deposit: 200,
    availability: "limited",
    rating: 4.8,
    reviews: 95,
    features: ["16GB RAM", "512GB SSD", "M2 Chip", "Retina Display"],
    location: "Tech Store",
    weight: "1.6kg",
    dimensions: "35x25x2cm"
  }
]

export function CustomerPortalShop() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 500])
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(true)
  
  // Page navigation states
  const [currentPage, setCurrentPage] = useState<"shop" | "product" | "cart" | "delivery" | "payment">("shop")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [deliveryData, setDeliveryData] = useState<any>(null)
  
  // Cart and wishlist states
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])

  // Extract unique values for filters
  const categories = Array.from(new Set(rentalProducts.map(p => p.category)))
  const brands = Array.from(new Set(rentalProducts.map(p => p.brand)))
  const colors = Array.from(new Set(rentalProducts.map(p => p.color)))
  const conditions = Array.from(new Set(rentalProducts.map(p => p.condition)))

  // Filter and sort products
  const filteredProducts = rentalProducts
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand)
      const matchesColor = selectedColors.length === 0 || selectedColors.includes(product.color)
      const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(product.condition)
      const matchesPrice = product.pricing.daily >= priceRange[0] && product.pricing.daily <= priceRange[1]
      
      return matchesSearch && matchesCategory && matchesBrand && matchesColor && matchesCondition && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-low":
          return a.pricing.daily - b.pricing.daily
        case "price-high":
          return b.pricing.daily - a.pricing.daily
        case "rating":
          return b.rating - a.rating
        case "reviews":
          return b.reviews - a.reviews
        default:
          return 0
      }
    })

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand])
    } else {
      setSelectedBrands(selectedBrands.filter(b => b !== brand))
    }
  }

  const handleColorChange = (color: string, checked: boolean) => {
    if (checked) {
      setSelectedColors([...selectedColors, color])
    } else {
      setSelectedColors(selectedColors.filter(c => c !== color))
    }
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions([...selectedConditions, condition])
    } else {
      setSelectedConditions(selectedConditions.filter(c => c !== condition))
    }
  }

  const addToCart = (product: any, quantity = 1, startDate?: Date, endDate?: Date) => {
    const newItem = {
      id: product.id + '_' + Date.now(), // Unique cart item ID
      productId: product.id,
      name: product.name,
      pricing: product.pricing,
      quantity,
      startDate: startDate || new Date(),
      endDate: endDate || addDays(new Date(), 7),
      product // Keep full product data
    }
    setCart([...cart, newItem])
  }

  const addToWishlist = (product: any) => {
    if (!wishlist.find(item => item.id === product.id)) {
      setWishlist([...wishlist, product])
    }
  }

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setCurrentPage("product")
  }

  const handleCartClick = () => {
    setCurrentPage("cart")
  }

  const handleProceedToCheckout = () => {
    setCurrentPage("delivery")
  }

  const handleDeliveryConfirm = (data: any) => {
    setDeliveryData(data)
    setCurrentPage("payment")
  }

  const handlePaymentComplete = (paymentData: any) => {
    // Handle successful payment
    console.log("Payment completed:", paymentData)
    alert("Order placed successfully!")
    setCart([])
    setCurrentPage("shop")
  }

  const handleBackToShop = () => {
    setCurrentPage("shop")
    setSelectedProduct(null)
  }

  const handleBackToCart = () => {
    setCurrentPage("cart")
  }

  const handleBackToDelivery = () => {
    setCurrentPage("delivery")
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "default"
      case "limited":
        return "secondary"
      case "unavailable":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Render different pages based on current state
  if (currentPage === "product" && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onAddToCart={addToCart}
        onBack={handleBackToShop}
        onAddToWishlist={addToWishlist}
      />
    )
  }

  if (currentPage === "cart") {
    return (
      <CartPage
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        onBack={handleBackToShop}
      />
    )
  }

  if (currentPage === "delivery") {
    return (
      <DeliveryPage
        items={cart}
        onBack={handleBackToCart}
        onContinue={handleDeliveryConfirm}
      />
    )
  }

  if (currentPage === "payment") {
    return (
      <PaymentPage
        items={cart}
        deliveryData={deliveryData}
        onBack={handleBackToDelivery}
        onPayNow={handlePaymentComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rental Shop</h1>
              <p className="text-gray-600">Browse and rent high-quality products</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {filteredProducts.length} Products
              </Badge>
              <Button variant="outline" size="sm" onClick={handleCartClick}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cart.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Product Attributes</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <Label className="text-sm font-medium">Brand</Label>
                    <div className="mt-2 space-y-2">
                      {brands.map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={selectedBrands.includes(brand)}
                            onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                          />
                          <Label htmlFor={`brand-${brand}`} className="text-sm">
                            {brand}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div>
                    <Label className="text-sm font-medium">Color</Label>
                    <div className="mt-2 space-y-2">
                      {colors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={selectedColors.includes(color)}
                            onCheckedChange={(checked) => handleColorChange(color, checked as boolean)}
                          />
                          <Label htmlFor={`color-${color}`} className="text-sm">
                            {color}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Condition Filter */}
                  <div>
                    <Label className="text-sm font-medium">Condition</Label>
                    <div className="mt-2 space-y-2">
                      {conditions.map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <Checkbox
                            id={`condition-${condition}`}
                            checked={selectedConditions.includes(condition)}
                            onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                          />
                          <Label htmlFor={`condition-${condition}`} className="text-sm">
                            {condition}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium">Price Range (per day)</Label>
                    <div className="mt-4 px-3">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedBrands([])
                      setSelectedColors([])
                      setSelectedConditions([])
                      setPriceRange([0, 500])
                      setSelectedCategory("all")
                    }}
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Controls */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <div className="flex-1 w-full relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {!showFilters && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowFilters(true)}
                    className="w-full sm:w-auto"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Sort by:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name A-Z</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="reviews">Most Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      <Package className="h-16 w-16 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="absolute top-2 right-2"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{product.brand} • {product.color}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>

                      <div className="text-lg font-bold mb-2">
                        ${product.pricing.daily}/day
                      </div>

                      <Badge variant={getAvailabilityColor(product.availability)} className="mb-3 text-xs">
                        {product.availability}
                      </Badge>

                      <div className="space-y-2">
                        <Button size="sm" className="w-full" onClick={() => handleProductClick(product)}>
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" className="w-full" onClick={() => addToCart(product)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Products List View */}
            {viewMode === "list" && (
              <div className="overflow-x-auto">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead className="min-w-[100px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Brand</TableHead>
                        <TableHead className="min-w-[100px]">Condition</TableHead>
                        <TableHead className="min-w-[100px]">Price/Day</TableHead>
                        <TableHead className="min-w-[100px]">Rating</TableHead>
                        <TableHead className="min-w-[120px]">Availability</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{product.name}</div>
                                <div className="text-sm text-gray-500 truncate">{product.description.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.condition}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">${product.pricing.daily}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{product.rating}</span>
                              <span className="text-gray-500">({product.reviews})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAvailabilityColor(product.availability)}>
                              {product.availability}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => addToCart(product)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-8">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">...</Button>
                <Button variant="outline" size="sm">10</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
