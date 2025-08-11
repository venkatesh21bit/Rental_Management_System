"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  ShoppingCart, 
  Package, 
  Minus,
  Plus,
  Heart,
  Trash2,
  ChevronRight
} from "lucide-react"
import { format, differenceInDays } from "date-fns"

interface CartItem {
  id: string
  name: string
  pricing: { daily: number }
  quantity: number
  startDate: Date
  endDate: Date
  image?: string
}

interface CartPageProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onProceedToCheckout: () => void
  onBack: () => void
}

export function CartPage({ items, onUpdateQuantity, onRemoveItem, onProceedToCheckout, onBack }: CartPageProps) {
  const [couponCode, setCouponCode] = useState("")

  const calculateItemTotal = (item: CartItem) => {
    const days = differenceInDays(item.endDate, item.startDate) + 1
    return item.pricing.daily * item.quantity * days
  }

  const subtotal = items.reduce((total, item) => total + calculateItemTotal(item), 0)
  const deliveryCharge = 0 // Free delivery
  const taxes = Math.round(subtotal * 0.1) // 10% tax
  const total = subtotal + deliveryCharge + taxes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Review Order</span>
          <ChevronRight className="h-4 w-4" />
          <span>Delivery</span>
          <ChevronRight className="h-4 w-4" />
          <span>Payment</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-red-600">Order Overview</h2>
            
            {items.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-4">Add some products to get started</p>
                  <Button onClick={onBack}>Continue Shopping</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">Product Name</h3>
                          <p className="text-2xl font-bold">₹{item.pricing.daily}.00</p>
                          <p className="text-sm text-gray-600 mb-2">
                            {format(item.startDate, "MMM dd")} - {format(item.endDate, "MMM dd")} 
                            ({differenceInDays(item.endDate, item.startDate) + 1} days)
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Qty</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button variant="outline" size="sm">
                              <Heart className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-red-600 font-medium">Delivery Charge</span>
                    <span>-</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-red-600 font-medium">Sub Total</span>
                    <span className="text-red-600 font-bold">₹{subtotal}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-red-600 font-medium">Taxes</span>
                    <span className="text-red-600">₹{taxes}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-red-600">Total</span>
                    <span className="text-red-600">₹{total}</span>
                  </div>
                  
                  <div className="mt-6">
                    <Label className="text-sm font-medium">Apply Coupon</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-6 bg-red-500 hover:bg-red-600"
                    onClick={onProceedToCheckout}
                    disabled={items.length === 0}
                  >
                    Proceed to checkout
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
