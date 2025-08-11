"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CustomerNavigation } from "@/components/navigation/customer-navigation"
import { CustomerPortalShop } from "@/components/customer-portal-shop"
import { CustomerPortal } from "@/components/customer-portal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  ShoppingCart, 
  Clock, 
  Heart, 
  CreditCard, 
  FileText,
  Phone,
  Mail,
  MessageCircle
} from "lucide-react"

interface CustomerPlatformProps {
  userData: any
  onSignOut: () => void
}

export function CustomerPlatform({ userData, onSignOut }: CustomerPlatformProps) {
  const [activeTab, setActiveTab] = useState("customer-shop")

  // Mock customer data
  const customerStats = {
    activeRentals: userData.currentRentals || 2,
    totalRentals: userData.totalRentals || 12,
    favoriteItems: 8,
    totalSpent: 2450,
    memberSince: userData.joinDate || "2024-01-15"
  }

  return (
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
            <CustomerPortalShop />
          </TabsContent>

          {/* Customer Account Portal */}
          <TabsContent value="customer-portal">
            <CustomerPortal />
          </TabsContent>

          {/* My Rentals */}
          <TabsContent value="my-rentals">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Rentals</h1>
                  <p className="text-gray-600">Track and manage your current and past rentals</p>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">
                  {customerStats.activeRentals} Active
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Rentals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customerStats.activeRentals}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Rentals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customerStats.totalRentals}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${customerStats.totalSpent}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Member Since</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2024</div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Rentals */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Rentals</CardTitle>
                  <CardDescription>Items you currently have rented</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Package className="h-10 w-10 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Professional Camera Kit</h3>
                            <p className="text-gray-600">Rental ID: RO-2024-045</p>
                            <p className="text-sm text-gray-500">Due: March 18, 2024</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">Active</Badge>
                          <div className="text-lg font-semibold mt-1">$375.00</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Package className="h-10 w-10 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Sound System Package</h3>
                            <p className="text-gray-600">Rental ID: RO-2024-043</p>
                            <p className="text-sm text-gray-500">Due: March 20, 2024</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">Extension Requested</Badge>
                          <div className="text-lg font-semibold mt-1">$540.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  {customerStats.favoriteItems} Items
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Favorite items would be mapped here */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Package className="h-8 w-8 text-blue-600" />
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">Professional Camera Kit</h3>
                    <p className="text-gray-600 text-sm">Starting at $75/day</p>
                    <Button className="w-full mt-4" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
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
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-blue-600" />
                            <div>
                              <div className="font-semibold">•••• 4242</div>
                              <div className="text-gray-600 text-sm">Expires 12/25</div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
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
                    <Button className="w-full">
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
  )
}
