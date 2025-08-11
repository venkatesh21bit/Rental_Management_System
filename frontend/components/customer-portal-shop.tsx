"use client"

import { useState, useEffect } from "react"
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
  Plus,
  Loader2
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { ProductDetail } from "./product-detail"
import { CartPage } from "./cart-page"
import { DeliveryPage } from "./delivery-page"
import { PaymentPage } from "./payment-page"
import { useProducts, useCategories, useCart } from "@/hooks/use-api"
import { toast } from "sonner"

interface CustomerPortalShopProps {
  sharedWishlist?: any[]
  onWishlistChange?: (wishlist: any[]) => void
}

export function CustomerPortalShop({ sharedWishlist = [], onWishlistChange }: CustomerPortalShopProps = {}) {
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
  
  // Wishlist state
  const [wishlist, setWishlist] = useState<any[]>(sharedWishlist)

  // API hooks
  const { 
    products, 
    loading: productsLoading, 
    error: productsError, 
    pagination,
    fetchProducts 
  } = useProducts({
    search: searchTerm,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    sortBy: sortBy as any,
    sortOrder: sortBy.includes("price-high") ? "desc" : "asc",
    page: 1,
    limit: 20
  })

  const { categories, loading: categoriesLoading } = useCategories()
  const { 
    cartItems, 
    itemCount, 
    addToCart: addToCartHook, 
    isProductInCart: isProductInCartHook,
    removeItem: removeFromCartHook,
    clearCart: clearCartHook,
    total: cartTotal
  } = useCart()

  // Sync wishlist changes with parent component
  const updateWishlist = (newWishlist: any[]) => {
    setWishlist(newWishlist)
    if (onWishlistChange) {
      onWishlistChange(newWishlist)
    }
  }

  // Update filters and refresh products
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchProducts({
        search: searchTerm,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        sortBy: sortBy as any,
        sortOrder: sortBy.includes("price-high") ? "desc" : "asc",
        page: 1,
        limit: 20
      })
    }, 300) // Debounce search

    return () => clearTimeout(delayTimer)
  }, [searchTerm, selectedCategory, sortBy, fetchProducts])

  // Extract unique values for filters from products
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)))
  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean)))
  const conditions = Array.from(new Set(products.map(p => p.condition).filter(Boolean)))

  // Filter products client-side for additional filters not handled by API
  const filteredProducts = products.filter((product) => {
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand || '')
    const matchesColor = selectedColors.length === 0 || selectedColors.includes(product.color || '')
    const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(product.condition || '')
    const dailyPrice = product.pricing?.daily || product.basePrice || 0
    const matchesPrice = dailyPrice >= priceRange[0] && dailyPrice <= priceRange[1]
    
    return matchesBrand && matchesColor && matchesCondition && matchesPrice
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
    // Check if product is already in cart
    if (isProductInCartHook(product.id)) {
      toast.error("Product is already in cart")
      return
    }
    
    const cartItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      startDate: startDate ? startDate.toISOString() : new Date().toISOString(),
      endDate: endDate ? endDate.toISOString() : addDays(new Date(), 7).toISOString(),
      pricing: product.pricing || { daily: product.basePrice },
      product
    }
    
    addToCartHook(cartItem)
    toast.success("Product added to cart!")
  }

  // Check if a product is already in cart
  const isProductInCart = (productId: string) => {
    return isProductInCartHook(productId)
  }

  // Check if a product is already in wishlist
  const isProductInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId)
  }

  const addToWishlist = (product: any) => {
    if (!wishlist.find(item => item.id === product.id)) {
      const newWishlist = [...wishlist, product]
      updateWishlist(newWishlist)
    }
  }

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter(item => item.id !== productId)
    updateWishlist(newWishlist)
  }

  const toggleWishlist = (product: any) => {
    if (isProductInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
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
    toast.success("Order placed successfully!")
    clearCartHook()
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
        onAddToWishlist={toggleWishlist}
      />
    )
  }

  if (currentPage === "cart") {
    return (
      <CartPage
        items={cartItems.map(item => ({
          ...item,
          name: item.productName || (item.product && item.product.name) || "",
          pricing: {
            ...item.pricing,
            daily: item.pricing?.daily ?? 0, // Ensure daily is always a number
          },
          startDate: new Date(item.startDate), // Convert string to Date
          endDate: new Date(item.endDate), // Convert string to Date
        }))}
        onUpdateQuantity={(itemId: string, quantity: number) => {
          // Handle cart quantity update
          // This would need to be implemented in the cart service
        }}
        onRemoveItem={removeFromCartHook}
        onProceedToCheckout={handleProceedToCheckout}
        onBack={handleBackToShop}
      />
    )
  }

  if (currentPage === "delivery") {
    return (
      <DeliveryPage
        items={cartItems.map(item => ({
          ...item,
          name: item.productName || (item.product && item.product.name) || "",
          pricing: {
            ...item.pricing,
            daily: item.pricing?.daily ?? 0, // Ensure daily is always a number
          },
          startDate: new Date(item.startDate), // Convert string to Date
          endDate: new Date(item.endDate), // Convert string to Date
        }))}
        onBack={handleBackToCart}
        onContinue={handleDeliveryConfirm}
      />
    )
  }

  if (currentPage === "payment") {
    return (
      <PaymentPage
        items={cartItems.map(item => ({
          ...item,
          name: item.productName || (item.product && item.product.name) || "",
          pricing: {
            ...item.pricing,
            daily: item.pricing?.daily ?? 0, // Ensure daily is always a number
          },
          startDate: new Date(item.startDate), // Convert string to Date
          endDate: new Date(item.endDate), // Convert string to Date
        }))}
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
                Cart ({itemCount})
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
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <Label className="text-sm font-medium">Brand</Label>
                    <div className="mt-2 space-y-2">
                      {brands.filter(brand => brand).map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={selectedBrands.includes(brand!)}
                            onCheckedChange={(checked) => handleBrandChange(brand!, checked as boolean)}
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
                      {colors.filter(color => color).map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={selectedColors.includes(color!)}
                            onCheckedChange={(checked) => handleColorChange(color!, checked as boolean)}
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
                      {conditions.filter(condition => condition).map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <Checkbox
                            id={`condition-${condition}`}
                            checked={selectedConditions.includes(condition!)}
                            onCheckedChange={(checked) => handleConditionChange(condition!, checked as boolean)}
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
              <>
                {productsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative">
                          <Loader2 className="h-8 w-8 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load products</h3>
                    <p className="text-gray-600 mb-4">{productsError}</p>
                    <Button onClick={() => fetchProducts()}>Try Again</Button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-100 relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-16 w-16 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                          <Button 
                            size="sm" 
                            variant={isProductInWishlist(product.id) ? "default" : "outline"}
                            className="absolute top-2 right-2"
                            onClick={() => toggleWishlist(product)}
                          >
                            <Heart className={`h-4 w-4 ${isProductInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                            <p className="text-xs text-gray-500 truncate">{product.brand} • {product.color}</p>
                          </div>
                          
                          {product.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{product.rating}</span>
                              {product.reviews && <span className="text-xs text-gray-500">({product.reviews})</span>}
                            </div>
                          )}

                          <div className="text-lg font-bold mb-2">
                            ${product.pricing?.daily || product.basePrice}/day
                          </div>

                          <Badge variant={product.availability === "available" ? "default" : product.availability === "limited" ? "secondary" : "destructive"} className="mb-3 text-xs">
                            {product.availability}
                          </Badge>

                          <div className="space-y-2">
                            <Button size="sm" className="w-full" onClick={() => handleProductClick(product)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => addToCart(product)}
                              variant={isProductInCart(product.id) ? "secondary" : "default"}
                              disabled={isProductInCart(product.id) || product.availability === "unavailable"}
                            >
                              {isProductInCart(product.id) ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Added to Cart
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add to Cart
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
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
                              <Button size="sm" variant="outline" onClick={() => handleProductClick(product)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => addToCart(product)}
                                variant={isProductInCart(product.id) ? "secondary" : "default"}
                                disabled={isProductInCart(product.id)}
                              >
                                {isProductInCart(product.id) ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
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
