"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-api"
import { toast } from "sonner"
import { 
  User, 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Building,
  ShoppingCart,
  Package,
  LogIn,
  UserPlus,
  Loader2
} from "lucide-react"

interface SignInProps {
  onSignIn: (userType: 'customer' | 'end-user', userData: any) => void
  onShowSignUp: () => void
}

export function SignIn({ onSignIn, onShowSignUp }: SignInProps) {
  const [activeTab, setActiveTab] = useState("customer")
  const [showPassword, setShowPassword] = useState(false)
  
  // Use API hook for authentication
  const { login, isLoading } = useAuth()
  
  // Form states
  const [customerForm, setCustomerForm] = useState({
    email: "",
    password: ""
  })
  
  const [endUserForm, setEndUserForm] = useState({
    email: "",
    password: ""
  })

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await login(customerForm.email, customerForm.password)
      
      if (result.success) {
        toast.success("Successfully signed in!")
        // Call the parent's onSignIn with the user data
        onSignIn('customer', result)
      } else {
        toast.error(result.error || "Login failed. Please try again.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  const handleEndUserSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await login(endUserForm.email, endUserForm.password)
      
      if (result.success) {
        toast.success("Successfully signed in!")
        // Call the parent's onSignIn with the user data
        onSignIn('end-user', result)
      } else {
        toast.error(result.error || "Login failed. Please try again.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">RentalPro</h1>
          </div>
          <p className="text-xl text-gray-600">Professional Rental Management System</p>
        </div>

        {/* Platform Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Customer Platform Card */}
          <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeTab === "customer" ? "ring-2 ring-blue-500 shadow-lg" : ""
          }`} onClick={() => setActiveTab("customer")}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Customer Platform</CardTitle>
              <CardDescription>
                Access your rental account, browse products, and manage bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Personal rental dashboard
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  Product catalog & booking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Order history & invoices
                </div>
              </div>
            </CardContent>
          </Card>

          {/* End User Platform Card */}
          <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeTab === "end-user" ? "ring-2 ring-indigo-500 shadow-lg" : ""
          }`} onClick={() => setActiveTab("end-user")}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <CardTitle className="text-xl">End User Platform</CardTitle>
              <CardDescription>
                Administrative dashboard for staff and management operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Customer management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  Inventory & operations
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Reports & analytics
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sign In Forms */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {activeTab === "customer" ? (
                <>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Customer Sign In
                </>
              ) : (
                <>
                  <Building className="h-5 w-5 text-indigo-600" />
                  End User Sign In
                </>
              )}
            </CardTitle>
            <CardDescription>
              {activeTab === "customer" 
                ? "Access your personal rental account" 
                : "Administrative access for staff members"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Customer Sign In */}
              <TabsContent value="customer">
                <form onSubmit={handleCustomerSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-email"
                        type="email"
                        placeholder="customer@example.com"
                        className="pl-10"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={customerForm.password}
                        onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In to Customer Portal"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button variant="link" className="text-sm text-blue-600">
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <Button variant="outline" className="w-full" type="button" onClick={onShowSignUp}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Customer Account
                  </Button>
                </form>
              </TabsContent>

              {/* End User Sign In */}
              <TabsContent value="end-user">
                <form onSubmit={handleEndUserSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enduser-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="enduser-email"
                        type="email"
                        placeholder="admin@company.com"
                        className="pl-10"
                        value={endUserForm.email}
                        onChange={(e) => setEndUserForm({...endUserForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enduser-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="enduser-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={endUserForm.password}
                        onChange={(e) => setEndUserForm({...endUserForm, password: e.target.value})}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In to End User Portal"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button variant="link" className="text-sm text-indigo-600">
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <Button variant="outline" className="w-full" type="button" onClick={onShowSignUp}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create End User Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="max-w-md mx-auto mt-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm text-center">Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-2">Customer</Badge>
                <div className="space-y-1">
                  <div>Email: admin@admin.com</div>
                  <div>Password: admin</div>
                </div>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Admin</Badge>
                <div className="space-y-1">
                  <div>Email: admin@admin.com</div>
                  <div>Password: admin</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
