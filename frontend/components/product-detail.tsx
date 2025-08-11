"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Calendar as CalendarIcon, 
  ShoppingCart, 
  Package, 
  Star, 
  Heart,
  Share,
  Minus,
  Plus
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"

interface ProductDetailProps {
  product: any
  onAddToCart: (product: any, quantity: number, startDate: Date, endDate: Date) => void
  onBack: () => void
  onAddToWishlist: (product: any) => void
}

export function ProductDetail({ product, onAddToCart, onBack, onAddToWishlist }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [couponCode, setCouponCode] = useState("")

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0
    const days = differenceInDays(endDate, startDate) + 1
    return product.pricing.daily * quantity * days
  }

  const handleAddToCart = () => {
    if (startDate && endDate) {
      onAddToCart(product, quantity, startDate, endDate)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Products
              </Button>
              <span className="text-gray-400">/</span>
              <span className="font-medium">Product name</span>
            </div>
            <Button variant="outline" size="sm">
              Price List
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
                  <Package className="h-24 w-24 text-gray-400" />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute top-4 right-4"
                    onClick={() => onAddToWishlist(product)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full mt-4" onClick={() => onAddToWishlist(product)}>
                  Add to wish list
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="space-y-2">
                  {product.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {feature}
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 p-0">
                  Read More &gt;
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Product name</h1>
              <div className="text-2xl font-bold text-blue-600 mb-4">
                ₹ {product.pricing.daily} ( ₹{product.pricing.daily} / per unit )
              </div>
            </div>

            {/* Date Selection */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start mt-1">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "dd/mm/yyyy"}
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
                    <Label className="text-sm font-medium">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start mt-1">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "dd/MM/yyyy"}
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

                {/* Quantity */}
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="ml-auto"
                    onClick={handleAddToCart}
                    disabled={!startDate || !endDate}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                {/* Coupon */}
                <div className="mb-4">
                  <Label className="text-sm font-medium">Apply Coupon</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Terms & conditions</p>
                  <p>By purchasing this product, you agree to our rental terms and conditions.</p>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Share :</span>
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
