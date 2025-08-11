"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CustomerNavigation } from "@/components/navigation/customer-navigation"
import { CustomerPortalShop } from "@/components/customer-portal-shop"
import { CustomerPortal } from "@/components/customer-portal"
import { CustomerOrderHistory } from "@/components/customer-order-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Package, 
  ShoppingCart, 
  Clock, 
  Heart, 
  CreditCard, 
  FileText,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  Plus,
  Send,
  UserCircle
} from "lucide-react"

interface CustomerPlatformProps {
  userData: any
  onSignOut: () => void
}

export function CustomerPlatform({ userData, onSignOut }: CustomerPlatformProps) {
  const [activeTab, setActiveTab] = useState("customer-shop")
  const [currentPage, setCurrentPage] = useState<"main" | "add-to-cart" | "add-payment" | "chat">("main")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Mock customer data
  const customerStats = {
    activeRentals: userData.currentRentals || 2,
    totalRentals: userData.totalRentals || 12,
    favoriteItems: 8,
    totalSpent: 2450,
    memberSince: userData.joinDate || "2024-01-15"
  }

  // Mock wishlist data - in a real app this would come from API/state management
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: "RP001",
      name: "Professional Camera Kit",
      pricing: { daily: 75 },
      image: "/placeholder.jpg",
      category: "Photography"
    },
    {
      id: "RP004", 
      name: "Party Sound System",
      pricing: { daily: 75 },
      image: "/placeholder.jpg",
      category: "Audio"
    }
  ])

  // Mock payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: "pm_1",
      type: "card",
      last4: "4242",
      expiry: "12/25",
      brand: "Visa"
    }
  ])

  // Action handlers
  const handleAddToCart = (product: any) => {
    setSelectedProduct(product)
    setCurrentPage("add-to-cart")
  }

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(items => items.filter(item => item.id !== productId))
  }

  const handleAddPaymentMethod = () => {
    setCurrentPage("add-payment")
  }

  const handleStartChat = () => {
    setCurrentPage("chat")
  }

  const handleBackToMain = () => {
    setCurrentPage("main")
    setSelectedProduct(null)
  }

  const handleWishlistChange = (newWishlist: any[]) => {
    setWishlistItems(newWishlist)
  }

  // Add To Cart Page Component
  const AddToCartPage = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage('main')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Add to Cart</h1>
        </div>

        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Product Added Successfully</CardTitle>
              <CardDescription>
                {selectedProduct.name} has been added to your cart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-800 font-medium">
                    Item added to cart successfully!
                  </span>
                </div>
                <Badge variant="secondary">✓</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Quantity:</Label>
                  <Select defaultValue="1">
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label>Rental Duration:</Label>
                  <Select defaultValue="1-day">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-day">1 Day</SelectItem>
                      <SelectItem value="3-days">3 Days</SelectItem>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Cart
                </Button>
                <Button variant="outline" className="flex-1">
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  // Add Payment Page Component
  const AddPaymentPage = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage('main')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Add Payment Method</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Add a new payment method to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-type">Payment Type</Label>
              <Select defaultValue="credit-card">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="debit-card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input 
                id="card-number" 
                placeholder="1234 5678 9012 3456" 
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  placeholder="MM/YY" 
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input 
                  id="cvv" 
                  placeholder="123" 
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholder">Cardholder Name</Label>
              <Input 
                id="cardholder" 
                placeholder="John Doe" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-address">Billing Address</Label>
              <Textarea 
                id="billing-address" 
                placeholder="Enter your billing address"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Chat Page Component
  const ChatPage = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage('main')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Customer Support</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Live Chat Support
                </CardTitle>
                <CardDescription>
                  Connected with support agent
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
                      <p className="text-sm">Hello! How can I help you today?</p>
                      <span className="text-xs text-gray-500">Support Agent • 2:30 PM</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="bg-blue-500 p-3 rounded-lg shadow-sm max-w-xs">
                      <p className="text-sm text-white">Hi, I need help with my rental order.</p>
                      <span className="text-xs text-blue-200">You • 2:32 PM</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
                      <p className="text-sm">I'd be happy to help! Could you provide your order number?</p>
                      <span className="text-xs text-gray-500">Support Agent • 2:33 PM</span>
                    </div>
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Type your message..." 
                    className="flex-1"
                  />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Options */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View FAQ
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9 AM - 6 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10 AM - 4 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Conditional page rendering */}
      {currentPage === 'add-to-cart' && <AddToCartPage />}
      {currentPage === 'add-payment' && <AddPaymentPage />}
      {currentPage === 'chat' && <ChatPage />}
      
      {/* Main platform content */}
      {currentPage === 'main' && (
        <div className="min-h-screen bg-gray-50">
          <CustomerNavigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            userData={userData}
            onSignOut={onSignOut}
          />
          
          <main className="container mx-auto px-4 py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
          
          {/* Customer Shop */}
          <TabsContent value="customer-shop">
            <CustomerPortalShop 
              sharedWishlist={wishlistItems}
              onWishlistChange={handleWishlistChange}
            />
          </TabsContent>

          {/* Customer Account Portal */}
          <TabsContent value="customer-portal">
            <CustomerPortal />
          </TabsContent>

          {/* My Rentals - Order History */}
          <TabsContent value="my-rentals">
            <CustomerOrderHistory />
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Favorites</h1>
                  <p className="text-gray-600">Products you've saved for quick access</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {wishlistItems.length} Items
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.length > 0 ? (
                  wishlistItems.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Package className="h-8 w-8 text-blue-600" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromWishlist(item.id)}
                          >
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-gray-600 text-sm">Starting at ${item.pricing.daily}/day</p>
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">No favorites yet</h3>
                    <p className="text-gray-400">Items you favorite will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Billing & Payments</h1>
                <p className="text-gray-600">Manage your payment methods and billing history</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-semibold">Invoice #INV-2024-045</div>
                            <div className="text-gray-600">March 15, 2024</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">$375.00</div>
                            <Badge variant="default">Paid</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-8 w-8 text-blue-600" />
                              <div>
                                <div className="font-semibold">•••• {method.last4}</div>
                                <div className="text-gray-600 text-sm">Expires {method.expiry}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleAddPaymentMethod}
                        >
                          Add Payment Method
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Support */}
          <TabsContent value="support">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Customer Support</h1>
                <p className="text-gray-600">Get help with your rentals and account</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <Phone className="h-8 w-8 text-blue-600 mb-2" />
                    <CardTitle>Phone Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Call us for immediate assistance</p>
                    <div className="font-semibold">1-800-RENTAL-1</div>
                    <div className="text-sm text-gray-500">Mon-Fri 9AM-6PM</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Mail className="h-8 w-8 text-blue-600 mb-2" />
                    <CardTitle>Email Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Send us an email anytime</p>
                    <div className="font-semibold">support@rentalpro.com</div>
                    <div className="text-sm text-gray-500">24 hour response</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <MessageCircle className="h-8 w-8 text-blue-600 mb-2" />
                    <CardTitle>Live Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Chat with our support team</p>
                    <Button 
                      className="w-full"
                      onClick={handleStartChat}
                    >
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
      )}
    </>
  )
}
