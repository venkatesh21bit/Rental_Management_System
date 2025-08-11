"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2
} from "lucide-react"

interface SignUpProps {
  onSignUp: (userType: 'customer' | 'end-user', userData: any) => void
  onBackToSignIn: () => void
}

export function SignUp({ onSignUp, onBackToSignIn }: SignUpProps) {
  const [activeTab, setActiveTab] = useState("customer")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  
  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true
  })
  
  // End user form state
  const [endUserForm, setEndUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    role: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  })

  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (customerForm.password !== customerForm.confirmPassword) {
      toast.error("Passwords don't match!")
      return
    }
    
    if (!customerForm.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }
    
    setIsLoading(true)
    
    try {
      const registrationData = {
        username: customerForm.email, // Use email as username
        email: customerForm.email,
        password: customerForm.password,
        first_name: customerForm.firstName,
        last_name: customerForm.lastName,
        phone: customerForm.phone,
        address: `${customerForm.address}, ${customerForm.city}, ${customerForm.zipCode}`,
        user_type: 'customer'
      }

      const response = await register(registrationData)
      
      if (response.success) {
        toast.success('Customer account created successfully!')
        // Create customer data for parent component - use current user state
        const customerData = {
          id: `CUST-${Date.now()}`, // fallback ID
          name: `${customerForm.firstName} ${customerForm.lastName}`,
          email: customerForm.email,
          phone: customerForm.phone,
          address: `${customerForm.address}, ${customerForm.city}, ${customerForm.zipCode}`,
          type: "standard",
          joinDate: new Date().toISOString().split('T')[0],
          totalRentals: 0,
          currentRentals: 0
        }
        
        onSignUp('customer', customerData)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Customer registration error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndUserSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (endUserForm.password !== endUserForm.confirmPassword) {
      toast.error("Passwords don't match!")
      return
    }
    
    if (!endUserForm.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }
    
    setIsLoading(true)
    
    try {
      const registrationData = {
        username: endUserForm.email, // Use email as username
        email: endUserForm.email,
        password: endUserForm.password,
        first_name: endUserForm.firstName,
        last_name: endUserForm.lastName,
        phone: endUserForm.phone,
        address: `${endUserForm.department} - ${endUserForm.role}`, // Store department/role in address field
        user_type: 'end_user',
        // Add custom fields for end user
        employee_id: endUserForm.employeeId,
        department: endUserForm.department,
        role: endUserForm.role
      }

      const response = await register(registrationData)
      
      if (response.success) {
        toast.success('End user account created successfully!')
        // Create end user data for parent component
        const endUserData = {
          id: `EMP-${Date.now()}`, // fallback ID
          name: `${endUserForm.firstName} ${endUserForm.lastName}`,
          email: endUserForm.email,
          employeeId: endUserForm.employeeId,
          role: endUserForm.role,
          department: endUserForm.department,
          permissions: ["read", "write"]
        }
        
        onSignUp('end-user', endUserData)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('End user registration error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-12 w-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">RentalPro</h1>
          </div>
          <p className="text-xl text-gray-600">Create Your Account</p>
          <Button 
            variant="ghost" 
            onClick={onBackToSignIn}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>

        {/* Sign Up Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Choose your account type and fill in your details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="customer" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Customer Account
                </TabsTrigger>
                <TabsTrigger value="end-user" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  End User Account
                </TabsTrigger>
              </TabsList>

              {/* Customer Sign Up */}
              <TabsContent value="customer">
                <form onSubmit={handleCustomerSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-first-name">First Name</Label>
                      <Input
                        id="customer-first-name"
                        type="text"
                        placeholder="John"
                        value={customerForm.firstName}
                        onChange={(e) => setCustomerForm({...customerForm, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-last-name">Last Name</Label>
                      <Input
                        id="customer-last-name"
                        type="text"
                        placeholder="Smith"
                        value={customerForm.lastName}
                        onChange={(e) => setCustomerForm({...customerForm, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-email"
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="pl-10"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customer-address"
                        type="text"
                        placeholder="123 Main Street"
                        className="pl-10"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-city">City</Label>
                      <Input
                        id="customer-city"
                        type="text"
                        placeholder="New York"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-zip">ZIP Code</Label>
                      <Input
                        id="customer-zip"
                        type="text"
                        placeholder="10001"
                        value={customerForm.zipCode}
                        onChange={(e) => setCustomerForm({...customerForm, zipCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={customerForm.password}
                          onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={customerForm.confirmPassword}
                          onChange={(e) => setCustomerForm({...customerForm, confirmPassword: e.target.value})}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="customer-terms"
                        checked={customerForm.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setCustomerForm({...customerForm, agreeToTerms: checked as boolean})
                        }
                      />
                      <Label htmlFor="customer-terms" className="text-sm">
                        I agree to the <span className="text-blue-600 underline cursor-pointer">Terms of Service</span> and{" "}
                        <span className="text-blue-600 underline cursor-pointer">Privacy Policy</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="customer-newsletter"
                        checked={customerForm.subscribeNewsletter}
                        onCheckedChange={(checked) => 
                          setCustomerForm({...customerForm, subscribeNewsletter: checked as boolean})
                        }
                      />
                      <Label htmlFor="customer-newsletter" className="text-sm">
                        Subscribe to our newsletter for updates and special offers
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Customer Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* End User Sign Up */}
              <TabsContent value="end-user">
                <form onSubmit={handleEndUserSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enduser-first-name">First Name</Label>
                      <Input
                        id="enduser-first-name"
                        type="text"
                        placeholder="Jane"
                        value={endUserForm.firstName}
                        onChange={(e) => setEndUserForm({...endUserForm, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enduser-last-name">Last Name</Label>
                      <Input
                        id="enduser-last-name"
                        type="text"
                        placeholder="Doe"
                        value={endUserForm.lastName}
                        onChange={(e) => setEndUserForm({...endUserForm, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enduser-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="enduser-email"
                          type="email"
                          placeholder="jane@company.com"
                          className="pl-10"
                          value={endUserForm.email}
                          onChange={(e) => setEndUserForm({...endUserForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enduser-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="enduser-phone"
                          type="tel"
                          placeholder="+1 (555) 987-6543"
                          className="pl-10"
                          value={endUserForm.phone}
                          onChange={(e) => setEndUserForm({...endUserForm, phone: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enduser-employee-id">Employee ID</Label>
                      <Input
                        id="enduser-employee-id"
                        type="text"
                        placeholder="EMP001"
                        value={endUserForm.employeeId}
                        onChange={(e) => setEndUserForm({...endUserForm, employeeId: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enduser-department">Department</Label>
                      <Input
                        id="enduser-department"
                        type="text"
                        placeholder="Operations"
                        value={endUserForm.department}
                        onChange={(e) => setEndUserForm({...endUserForm, department: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enduser-role">Role</Label>
                      <Input
                        id="enduser-role"
                        type="text"
                        placeholder="Manager"
                        value={endUserForm.role}
                        onChange={(e) => setEndUserForm({...endUserForm, role: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enduser-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="enduser-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={endUserForm.password}
                          onChange={(e) => setEndUserForm({...endUserForm, password: e.target.value})}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enduser-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="enduser-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={endUserForm.confirmPassword}
                          onChange={(e) => setEndUserForm({...endUserForm, confirmPassword: e.target.value})}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="enduser-terms"
                        checked={endUserForm.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setEndUserForm({...endUserForm, agreeToTerms: checked as boolean})
                        }
                      />
                      <Label htmlFor="enduser-terms" className="text-sm">
                        I agree to the <span className="text-blue-600 underline cursor-pointer">Employee Terms of Service</span> and{" "}
                        <span className="text-blue-600 underline cursor-pointer">Company Policies</span>
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create End User Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
