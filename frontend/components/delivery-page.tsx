"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react"

interface CartItem {
  id: string
  name: string
  pricing: { daily: number }
  quantity: number
  startDate: Date
  endDate: Date
}

interface DeliveryPageProps {
  items: CartItem[]
  onBack: () => void
  onContinue: (deliveryData: any) => void
}

export function DeliveryPage({ items, onBack, onContinue }: DeliveryPageProps) {
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [invoiceAddress, setInvoiceAddress] = useState("")
  const [sameAsDelivery, setSameAsDelivery] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState("")
  const [couponCode, setCouponCode] = useState("")

  const subtotal = items.reduce((total, item) => {
    const days = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + (item.pricing.daily * item.quantity * days)
  }, 0)
  
  const deliveryCharge = 0
  const taxes = Math.round(subtotal * 0.1)
  const total = subtotal + deliveryCharge + taxes

  const handleConfirm = () => {
    const deliveryData = {
      deliveryAddress,
      invoiceAddress: sameAsDelivery ? deliveryAddress : invoiceAddress,
      deliveryMethod,
      couponCode
    }
    onContinue(deliveryData)
  }

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
          <span className="font-medium">Delivery</span>
          <ChevronRight className="h-4 w-4" />
          <span>Payment</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Form */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-red-600">Delivery Address</h2>
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-red-600">Delivery Address</Label>
                    <textarea 
                      className="w-full mt-2 p-3 border rounded-lg resize-none h-24"
                      placeholder="Enter delivery address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-red-600">Invoice Address</Label>
                    <textarea 
                      className="w-full mt-2 p-3 border rounded-lg resize-none h-24"
                      placeholder="Enter invoice address"
                      value={invoiceAddress}
                      onChange={(e) => setInvoiceAddress(e.target.value)}
                      disabled={sameAsDelivery}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="same-address"
                      checked={sameAsDelivery}
                      onCheckedChange={(checked) => setSameAsDelivery(checked as boolean)}
                    />
                    <Label htmlFor="same-address" className="text-sm">
                      Billing address same as delivery address
                    </Label>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Choose Delivery Method</Label>
                    <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Please Pick Something" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Delivery (3-5 days)</SelectItem>
                        <SelectItem value="express">Express Delivery (1-2 days)</SelectItem>
                        <SelectItem value="same-day">Same Day Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600">Delivery charges</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-blue-600 mb-2">Order Summary</h3>
                  <p className="text-sm text-gray-600">{items.length} items - ₹ {subtotal}</p>
                  <ChevronDown className="h-4 w-4 text-gray-400 inline ml-2" />
                </div>
                
                <div className="space-y-3">
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
                  
                  <div className="mt-4">
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
                    onClick={handleConfirm}
                    disabled={!deliveryAddress || !deliveryMethod}
                  >
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={onBack}
            >
              &lt; back to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
