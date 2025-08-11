"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Smartphone,
  Wallet
} from "lucide-react"

interface CartItem {
  id: string
  name: string
  pricing: { daily: number }
  quantity: number
  startDate: Date
  endDate: Date
}

interface PaymentPageProps {
  items: CartItem[]
  deliveryData: any
  onBack: () => void
  onPayNow: (paymentData: any) => void
}

export function PaymentPage({ items, deliveryData, onBack, onPayNow }: PaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [securityCode, setSecurityCode] = useState("")
  const [nameOnCard, setNameOnCard] = useState("")
  const [saveCardDetails, setSaveCardDetails] = useState(false)
  const [couponCode, setCouponCode] = useState("")

  const subtotal = items.reduce((total, item) => {
    const days = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + (item.pricing.daily * item.quantity * days)
  }, 0)
  
  const deliveryCharge = 0
  const taxes = Math.round(subtotal * 0.1)
  const total = subtotal + deliveryCharge + taxes

  const handlePayNow = () => {
    const paymentData = {
      paymentMethod,
      cardNumber,
      expiryDate,
      securityCode,
      nameOnCard,
      saveCardDetails,
      couponCode
    }
    onPayNow(paymentData)
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
          <span>Delivery</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium">Payment</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-red-600">Confirm Order</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Choose a payment method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </Label>
                  </div>
                  
                  {paymentMethod === "credit-card" && (
                    <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                      <div>
                        <Label>Name on Card</Label>
                        <Input 
                          placeholder="Cardholder Name"
                          value={nameOnCard}
                          onChange={(e) => setNameOnCard(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Card Number</Label>
                        <Input 
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Expiration Date</Label>
                          <Input 
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Security Code</Label>
                          <Input 
                            placeholder="CVV"
                            value={securityCode}
                            onChange={(e) => setSecurityCode(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="debit-card" id="debit-card" />
                    <Label htmlFor="debit-card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Debit Card
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI Pay
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paytm" id="paytm" />
                    <Label htmlFor="paytm" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Paytm
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="save-card"
                    checked={saveCardDetails}
                    onCheckedChange={(checked) => setSaveCardDetails(checked as boolean)}
                  />
                  <Label htmlFor="save-card" className="text-sm">
                    Save my card details
                  </Label>
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
                    onClick={handlePayNow}
                    disabled={paymentMethod === "credit-card" && (!cardNumber || !nameOnCard || !expiryDate || !securityCode)}
                  >
                    Pay Now
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
